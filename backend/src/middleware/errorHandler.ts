import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  console.error('❌ Erro:', err);

  // Erro de validação do Prisma
  if (err.name === 'PrismaClientValidationError') {
    const message = 'Dados inválidos fornecidos';
    error = { message, statusCode: 400 } as AppError;
  }

  // Erro de chave única do Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const message = 'Recurso já existe';
    error = { message, statusCode: 409 } as AppError;
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = { message, statusCode: 401 } as AppError;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = { message, statusCode: 401 } as AppError;
  }

  // Erro de validação do Joi
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).details).map((val: any) => val.message).join(', ');
    error = { message, statusCode: 400 } as AppError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
