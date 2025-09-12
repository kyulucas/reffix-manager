# Manager Evolution API

Sistema de gestão administrativa para a Evolution API com foco em gestão de usuários, instâncias e comercialização da plataforma.

## 🚀 Características

- **Gestão de Usuários**: Sistema completo de usuários com diferentes níveis de permissão
- **Painel Administrativo**: Dashboard completo para administradores
- **Gestão de Instâncias**: Criação, edição, monitoramento e controle de instâncias
- **Sistema de Limites**: Controle de instâncias por usuário, mensagens/dia, etc.
- **Teste de Mensagens**: Interface simples para testar envio de mensagens
- **PostgreSQL Externo**: Suporte para usar PostgreSQL já instalado no servidor

## 🏗️ Arquitetura

- **Backend**: Node.js + Express + TypeScript + Prisma
- **Frontend**: React + TypeScript + Tailwind CSS
- **Banco de Dados**: PostgreSQL (externo ou local)
- **Autenticação**: JWT
- **Containerização**: Docker + Docker Compose

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL (externo ou local)
- Docker e Docker Compose (opcional)
- Evolution API rodando

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd manager-evolution-api
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo:
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# ===========================================
# CONFIGURAÇÕES DO BANCO DE DADOS POSTGRESQL
# ===========================================
# Configure para usar PostgreSQL externo
DB_HOST=seu-servidor-postgres.com
DB_PORT=5432
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=evolution_manager

# ===========================================
# CONFIGURAÇÕES DA APLICAÇÃO
# ===========================================
NODE_ENV=development
PORT=3001
JWT_SECRET=sua-chave-secreta-jwt-super-segura

# ===========================================
# CONFIGURAÇÕES DA EVOLUTION API
# ===========================================
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-da-evolution-api

# ===========================================
# CONFIGURAÇÕES DO FRONTEND
# ===========================================
REACT_APP_API_URL=http://localhost:3001
```

### 3. Instale as dependências

```bash
npm run install:all
```

### 4. Configure o banco de dados

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 5. Execute o projeto

#### Opção 1: Desenvolvimento local
```bash
npm run dev
```

#### Opção 2: Docker Compose
```bash
# Para usar PostgreSQL local
docker-compose --profile local-db up

# Para usar PostgreSQL externo (sem --profile local-db)
docker-compose up
```

## 🌐 Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 👤 Usuário Padrão

Após a primeira execução, você pode criar um usuário administrador através da API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Administrador",
    "email": "admin@example.com",
    "password": "123456",
    "role": "ADMIN"
  }'
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **users**: Usuários do sistema
- **user_limits**: Limites por usuário
- **instances**: Instâncias do WhatsApp
- **instance_settings**: Configurações das instâncias
- **instance_integrations**: Integrações (webhooks, etc.)
- **messages**: Histórico de mensagens

### Relacionamentos

- Um usuário pode ter múltiplas instâncias
- Cada usuário tem limites configuráveis
- Cada instância pode ter configurações e integrações
- Mensagens são vinculadas às instâncias

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Executa frontend e backend
npm run dev:backend         # Apenas backend
npm run dev:frontend        # Apenas frontend

# Build
npm run build              # Build completo
npm run build:backend      # Build do backend
npm run build:frontend     # Build do frontend

# Banco de dados
cd backend
npx prisma studio          # Interface visual do banco
npx prisma migrate dev     # Aplicar migrações
npx prisma generate        # Gerar cliente Prisma
```

## 🐳 Docker

### Usando PostgreSQL Externo

```bash
# Edite o .env com suas configurações do PostgreSQL
# Execute sem o profile local-db
docker-compose up
```

### Usando PostgreSQL Local

```bash
# Execute com o profile local-db
docker-compose --profile local-db up
```

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário

### Usuários (Admin)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário
- `PUT /api/users/:id/limits` - Atualizar limites

### Instâncias
- `GET /api/instances` - Listar instâncias
- `POST /api/instances` - Criar instância
- `PUT /api/instances/:id` - Atualizar instância
- `DELETE /api/instances/:id` - Deletar instância
- `GET /api/instances/:id/status` - Status da instância

### Teste
- `POST /api/test/send-message` - Enviar mensagem de teste
- `POST /api/test/check-number` - Verificar número WhatsApp
- `GET /api/test/qrcode/:instanceId` - QR Code da instância

## 🔒 Segurança

- Autenticação JWT
- Rate limiting
- Validação de dados com Joi
- CORS configurado
- Helmet para headers de segurança
- Controle de permissões por role

## 📈 Monitoramento

- Health check endpoint
- Logs estruturados
- Tratamento de erros centralizado
- Métricas de uso por usuário

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato através dos canais oficiais da TR Telecom.
