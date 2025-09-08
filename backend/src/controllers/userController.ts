import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Schemas de validação
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'CLIENT').default('CLIENT'),
  limits: Joi.object({
    maxInstances: Joi.number().min(1).default(1),
    maxMessagesPerDay: Joi.number().min(1).default(1000),
    maxContacts: Joi.number().min(1).default(100),
    maxGroups: Joi.number().min(1).default(10),
    canUseWebhooks: Joi.boolean().default(false),
    canUseIntegrations: Joi.boolean().default(false)
  }).optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid('ADMIN', 'CLIENT'),
  isActive: Joi.boolean()
});

const updateLimitsSchema = Joi.object({
  maxInstances: Joi.number().min(1),
  maxMessagesPerDay: Joi.number().min(1),
  maxContacts: Joi.number().min(1),
  maxGroups: Joi.number().min(1),
  canUseWebhooks: Joi.boolean(),
  canUseIntegrations: Joi.boolean()
});

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          limits: true,
          instances: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        limits: true,
        instances: {
          select: {
            id: true,
            name: true,
            status: true,
            phoneNumber: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { name, email, password, role, limits } = value;

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Usuário já existe com este email'
      });
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as 'ADMIN' | 'CLIENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Criar limites
    await prisma.userLimits.create({
      data: {
        userId: user.id,
        ...limits
      }
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    // Hash da senha se fornecida
    if (value.password) {
      value.password = await bcrypt.hash(value.password, 12);
    }

    // Atualizar usuário
    const user = await prisma.user.update({
      where: { id },
      data: value,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    // Deletar usuário (cascade deletará limites e instâncias)
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const updateUserLimits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updateLimitsSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    // Atualizar ou criar limites
    const limits = await prisma.userLimits.upsert({
      where: { userId: id },
      update: value,
      create: {
        userId: id,
        ...value
      }
    });

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Erro ao atualizar limites:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
