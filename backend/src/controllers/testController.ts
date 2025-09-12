import { Request, Response } from 'express';
import axios from 'axios';
import Joi from 'joi';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Schemas de validação
const sendMessageSchema = Joi.object({
  instanceId: Joi.string().required(),
  number: Joi.string().required(),
  message: Joi.string().required(),
  type: Joi.string().valid('text', 'media', 'location', 'contact').default('text'),
  mediaUrl: Joi.string().uri().when('type', {
    is: 'media',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const checkNumberSchema = Joi.object({
  instanceId: Joi.string().required(),
  number: Joi.string().required()
});

// Serviço para comunicação com Evolution API
const evolutionAPI = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

export const sendTestMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { instanceId, number, message, type, mediaUrl } = value;
    const userId = req.user!.id;

    // Verificar se instância pertence ao usuário
    const whereClause = req.user?.role === 'ADMIN' 
      ? { id: instanceId } 
      : { id: instanceId, userId };

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

    // Verificar se instância está conectada
    if (instance.status !== 'CONNECTED') {
      res.status(400).json({
        success: false,
        error: 'Instância não está conectada'
      });
      return;
    }

    // Verificar limite de mensagens do usuário
    const userLimits = await prisma.userLimits.findUnique({
      where: { userId }
    });

    if (userLimits) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const messagesToday = await prisma.message.count({
        where: {
          instanceId,
          createdAt: {
            gte: today
          }
        }
      });

      if (messagesToday >= userLimits.maxMessagesPerDay) {
        res.status(403).json({
          success: false,
          error: `Limite de mensagens diárias atingido (${userLimits.maxMessagesPerDay})`
        });
        return;
      }
    }

    // Preparar dados para envio
    let messageData: any = {
      number,
      text: message
    };

    // Adicionar mídia se fornecida
    if (type === 'media' && mediaUrl) {
      messageData.mediaUrl = mediaUrl;
    }

    // Enviar mensagem via Evolution API
    const response = await evolutionAPI.post(`/message/sendText/${instance.name}`, messageData);

    // Salvar mensagem no banco
    await prisma.message.create({
      data: {
        instanceId,
        to: number,
        from: instance.phoneNumber || 'unknown',
        body: message,
        type: type.toUpperCase(),
        timestamp: new Date(),
        status: 'SENT'
      }
    });

    res.json({
      success: true,
      data: {
        messageId: response.data.key?.id,
        status: 'SENT',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
    
    // Se for erro da Evolution API, retornar mensagem específica
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'Erro na Evolution API'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const checkWhatsAppNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = checkNumberSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { instanceId, number } = value;
    const userId = req.user!.id;

    // Verificar se instância pertence ao usuário
    const whereClause = req.user?.role === 'ADMIN' 
      ? { id: instanceId } 
      : { id: instanceId, userId };

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

    // Verificar se instância está conectada
    if (instance.status !== 'CONNECTED') {
      res.status(400).json({
        success: false,
        error: 'Instância não está conectada'
      });
      return;
    }

    // Verificar número via Evolution API
    const response = await evolutionAPI.post(`/chat/whatsappNumbers/${instance.name}`, {
      numbers: [number]
    });

    const result = response.data.find((item: any) => item.jid === number);

    res.json({
      success: true,
      data: {
        number,
        isWhatsApp: result ? result.exists : false,
        jid: result?.jid || null
      }
    });
  } catch (error) {
    console.error('Erro ao verificar número WhatsApp:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'Erro na Evolution API'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const getInstanceQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { instanceId } = req.params;
    const userId = req.user!.id;

    // Verificar se instância pertence ao usuário
    const whereClause = req.user?.role === 'ADMIN' 
      ? { id: instanceId } 
      : { id: instanceId, userId };

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

    // Buscar QR Code na Evolution API
    const response = await evolutionAPI.get(`/instance/connectionState/${instance.name}`);

    res.json({
      success: true,
      data: {
        qrCode: response.data.instance.qrcode?.base64,
        status: response.data.instance.state
      }
    });
  } catch (error) {
    console.error('Erro ao buscar QR Code:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || 'Erro na Evolution API'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
