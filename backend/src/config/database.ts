import { PrismaClient } from '@prisma/client';

// Configuração da URL do banco de dados
const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;

// Configurar variável de ambiente para o Prisma
process.env.DATABASE_URL = databaseUrl;

// Instância global do Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Função para testar conexão
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
    console.log(`📊 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    return false;
  }
}

// Função para desconectar
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('🔌 Desconectado do PostgreSQL');
}
