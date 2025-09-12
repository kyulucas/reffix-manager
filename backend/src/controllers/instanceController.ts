import { Request, Response } from 'express';
import axios from 'axios';
import Joi from 'joi';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Schemas de validação
const createInstanceSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  integration: Joi.string().valid('WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS', 'EVOLUTION').default('WHATSAPP-BAILEYS'),
  settings: Joi.object({
    rejectCall: Joi.boolean().default(false),
    msgCall: Joi.string().allow(''),
    groupsIgnore: Joi.boolean().default(false),
    alwaysOnline: Joi.boolean().default(false),
    readMessages: Joi.boolean().default(false),
    readStatus: Joi.boolean().default(false),
    syncFullHistory: Joi.boolean().default(false)
  }).optional()
});

const updateInstanceSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  isActive: Joi.boolean(),
  settings: Joi.object({
    rejectCall: Joi.boolean(),
    msgCall: Joi.string().allow(''),
    groupsIgnore: Joi.boolean(),
    alwaysOnline: Joi.boolean(),
    readMessages: Joi.boolean(),
    readStatus: Joi.boolean(),
    syncFullHistory: Joi.boolean()
  }).optional()
});

// Serviço para comunicação com Evolution API
const evolutionAPI = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

export const getAllInstances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Se for admin, pode ver todas as instâncias
    // Se for cliente, só vê as suas
    const whereClause = req.user?.role === 'ADMIN' ? {} : { userId: req.user!.id };

    const [instances, total] = await Promise.all([
      prisma.instance.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          settings: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.instance.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        instances,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const getInstanceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const whereClause = req.user?.role === 'ADMIN' 
      ? { id } 
      : { id, userId: req.user!.id };

    const instance = await prisma.instance.findFirst({
      where: whereClause,
      include: {
        settings: true,
        integrations: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Erro ao buscar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const createInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createInstanceSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { name, integration, settings } = value;
    const userId = req.user!.id;

    // Verificar limite de instâncias do usuário
    const userLimits = await prisma.userLimits.findUnique({
      where: { userId }
    });

    if (userLimits) {
      const currentInstances = await prisma.instance.count({
        where: { userId, isActive: true }
      });

      if (currentInstances >= userLimits.maxInstances) {
        res.status(403).json({
          success: false,
          error: `Limite de instâncias atingido (${userLimits.maxInstances})`
        });
        return;
      }
    }

    // Verificar se nome já existe
    const existingInstance = await prisma.instance.findUnique({
      where: { name }
    });

    if (existingInstance) {
      res.status(409).json({
        success: false,
        error: 'Nome da instância já existe'
      });
      return;
    }

    // Criar instância na Evolution API
    const evolutionResponse = await evolutionAPI.post('/instance/create', {
      instanceName: name,
      integration,
      qrcode: true,
      ...settings
    });

    if (!evolutionResponse.data.hash) {
      res.status(500).json({
        success: false,
        error: 'Erro ao criar instância na Evolution API'
      });
      return;
    }

    // Salvar instância no banco
    const instance = await prisma.instance.create({
      data: {
        name,
        token: evolutionResponse.data.hash,
        userId,
        status: 'DISCONNECTED'
      },
      include: {
        settings: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Criar configurações se fornecidas
    if (settings) {
      await prisma.instanceSettings.create({
        data: {
          instanceId: instance.id,
          ...settings
        }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...instance,
        qrCode: evolutionResponse.data.qrcode?.base64
      }
    });
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const updateInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updateInstanceSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const whereClause = req.user?.role === 'ADMIN' 
      ? { id } 
      : { id, userId: req.user!.id };

    // Verificar se instância existe
    const existingInstance = await prisma.instance.findFirst({
      where: whereClause
    });

    if (!existingInstance) {
      res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
      return;
    }

    // Atualizar instância
    const instance = await prisma.instance.update({
      where: { id },
      data: value,
      include: {
        settings: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Atualizar configurações se fornecidas
    if (value.settings) {
      await prisma.instanceSettings.upsert({
        where: { instanceId: id },
        update: value.settings,
        create: {
          instanceId: id,
          ...value.settings
        }
      });
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Erro ao atualizar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const deleteInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const whereClause = req.user?.role === 'ADMIN' 
      ? { id } 
      : { id, userId: req.user!.id };

    // Verificar se instância existe
    const existingInstance = await prisma.instance.findFirst({
      where: whereClause
    });

    if (!existingInstance) {
      res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
      return;
    }

    // Deletar instância na Evolution API
    try {
      await evolutionAPI.delete(`/instance/delete/${existingInstance.name}`);
    } catch (error) {
      console.warn('Erro ao deletar instância na Evolution API:', error);
    }

    // Deletar instância do banco
    await prisma.instance.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const getInstanceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const whereClause = req.user?.role === 'ADMIN' 
      ? { id } 
      : { id, userId: req.user!.id };

    const instance = await prisma.instance.findFirst({
      where: whereClause
    });

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
      return;
    }

    // Buscar status na Evolution API
    const response = await evolutionAPI.get(`/instance/connectionState/${instance.name}`);
    
    // Atualizar status no banco
    await prisma.instance.update({
      where: { id },
      data: { status: response.data.instance.state }
    });

    res.json({
      success: true,
      data: {
        status: response.data.instance.state,
        qrCode: response.data.instance.qrcode?.base64
      }
    });
  } catch (error) {
    console.error('Erro ao buscar status da instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const restartInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const whereClause = req.user?.role === 'ADMIN' 
      ? { id } 
      : { id, userId: req.user!.id };

    const instance = await prisma.instance.findFirst({
      where: whereClause
    });

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
      return;
    }

    // Reiniciar instância na Evolution API
    await evolutionAPI.post(`/instance/restart/${instance.name}`);

    res.json({
      success: true,
      message: 'Instância reiniciada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao reiniciar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const connectInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const whereClause = req.user?.role === 'ADMIN' 
      ? { id } 
      : { id, userId: req.user!.id };

    const instance = await prisma.instance.findFirst({
      where: whereClause
    });

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
      return;
    }

    // Conectar instância na Evolution API
    await evolutionAPI.post(`/instance/connect/${instance.name}`);

    res.json({
      success: true,
      message: 'Instância conectada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao conectar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const disconnectInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const whereClause = req.user?.role === 'ADMIN' 
      ? { id } 
      : { id, userId: req.user!.id };

    const instance = await prisma.instance.findFirst({
      where: whereClause
    });

    if (!instance) {
      res.status(404).json({
        success: false,
        error: 'Instância não encontrada'
      });
      return;
    }

    // Desconectar instância na Evolution API
    await evolutionAPI.post(`/instance/logout/${instance.name}`);

    res.json({
      success: true,
      message: 'Instância desconectada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
