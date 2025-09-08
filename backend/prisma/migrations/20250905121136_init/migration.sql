-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "InstanceStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'QRCODE', 'OPENING', 'PAIRING', 'UNPAIRED', 'UNPAIRED_IDLE', 'TIMEOUT', 'TAKEOVER', 'FAILED');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('WEBHOOK', 'RABBITMQ', 'SQS', 'CHATWOOT', 'TYPEBOT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_limits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxInstances" INTEGER NOT NULL DEFAULT 1,
    "maxMessagesPerDay" INTEGER NOT NULL DEFAULT 1000,
    "maxContacts" INTEGER NOT NULL DEFAULT 100,
    "maxGroups" INTEGER NOT NULL DEFAULT 10,
    "canUseWebhooks" BOOLEAN NOT NULL DEFAULT true,
    "canUseIntegrations" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InstanceStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "qrCode" TEXT,
    "phoneNumber" TEXT,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_settings" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "rejectCall" BOOLEAN NOT NULL DEFAULT false,
    "msgCall" TEXT,
    "groupsIgnore" BOOLEAN NOT NULL DEFAULT false,
    "alwaysOnline" BOOLEAN NOT NULL DEFAULT false,
    "readMessages" BOOLEAN NOT NULL DEFAULT false,
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    "syncFullHistory" BOOLEAN NOT NULL DEFAULT false,
    "proxyHost" TEXT,
    "proxyPort" TEXT,
    "proxyProtocol" TEXT,
    "proxyUsername" TEXT,
    "proxyPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_integrations" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_limits_userId_key" ON "user_limits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "instances_name_key" ON "instances"("name");

-- CreateIndex
CREATE UNIQUE INDEX "instances_token_key" ON "instances"("token");

-- CreateIndex
CREATE UNIQUE INDEX "instance_settings_instanceId_key" ON "instance_settings"("instanceId");

-- AddForeignKey
ALTER TABLE "user_limits" ADD CONSTRAINT "user_limits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instances" ADD CONSTRAINT "instances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_settings" ADD CONSTRAINT "instance_settings_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_integrations" ADD CONSTRAINT "instance_integrations_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
