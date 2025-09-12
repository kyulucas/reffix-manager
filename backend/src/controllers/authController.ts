import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Schemas de validação
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'CLIENT').default('CLIENT')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Gerar token JWT
const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: '7d'
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { name, email, password, role } = value;

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

    // Criar limites padrão para o usuário
    await prisma.userLimits.create({
      data: {
        userId: user.id,
        maxInstances: role === 'ADMIN' ? 999 : 1,
        maxMessagesPerDay: role === 'ADMIN' ? 999999 : 1000,
        maxContacts: role === 'ADMIN' ? 999999 : 100,
        maxGroups: role === 'ADMIN' ? 999999 : 10,
        canUseWebhooks: role === 'ADMIN',
        canUseIntegrations: role === 'ADMIN'
      }
    });

    // Gerar token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { email, password } = value;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        limits: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
      return;
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
      return;
    }

    // Gerar token
    const token = generateToken(user.id);

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Verificar se é o primeiro acesso (banco vazio)
export const checkFirstAccess = async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    
    res.json({
      success: true,
      data: {
        isFirstAccess: userCount === 0
      }
    });
  } catch (error) {
    console.error('Erro ao verificar primeiro acesso:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
