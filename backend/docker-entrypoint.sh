#!/bin/bash
set -e

echo "🚀 Iniciando Evolution Manager Backend..."

# Aguardar o banco de dados estar disponível
echo "⏳ Aguardando banco de dados..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Banco não disponível - aguardando..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

# Executar migrações (ignora se já foram aplicadas)
echo "🔄 Executando migrações do banco de dados..."
npx prisma migrate deploy || echo "⚠️  Migrações já aplicadas ou erro (continuando...)"

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo "🎉 Inicialização concluída! Iniciando aplicação..."

# Executar o comando passado como argumento
exec "$@"
