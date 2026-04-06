-- CreateEnum
CREATE TYPE "KujiStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('available', 'opened');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'completed', 'revoked', 'expired');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kuji" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "KujiStatus" NOT NULL DEFAULT 'draft',
    "gridColumns" INTEGER NOT NULL DEFAULT 6,
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kuji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeTier" (
    "id" TEXT NOT NULL,
    "kujiId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "kujiId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "gridPosition" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'available',
    "openedAt" TIMESTAMP(3),
    "openedBySessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSession" (
    "id" TEXT NOT NULL,
    "kujiId" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "allowedDraws" INTEGER NOT NULL,
    "usedDraws" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawLog" (
    "id" TEXT NOT NULL,
    "kujiId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "ticketSerialNumber" INTEGER NOT NULL,
    "gridPosition" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "PrizeTier_kujiId_idx" ON "PrizeTier"("kujiId");

-- CreateIndex
CREATE INDEX "Ticket_kujiId_status_idx" ON "Ticket"("kujiId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_kujiId_serialNumber_key" ON "Ticket"("kujiId", "serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_kujiId_gridPosition_key" ON "Ticket"("kujiId", "gridPosition");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSession_accessCode_key" ON "ClientSession"("accessCode");

-- CreateIndex
CREATE INDEX "ClientSession_kujiId_idx" ON "ClientSession"("kujiId");

-- CreateIndex
CREATE INDEX "DrawLog_kujiId_openedAt_idx" ON "DrawLog"("kujiId", "openedAt");

-- CreateIndex
CREATE INDEX "DrawLog_sessionId_openedAt_idx" ON "DrawLog"("sessionId", "openedAt");

-- AddForeignKey
ALTER TABLE "PrizeTier" ADD CONSTRAINT "PrizeTier_kujiId_fkey" FOREIGN KEY ("kujiId") REFERENCES "Kuji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_kujiId_fkey" FOREIGN KEY ("kujiId") REFERENCES "Kuji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_openedBySessionId_fkey" FOREIGN KEY ("openedBySessionId") REFERENCES "ClientSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSession" ADD CONSTRAINT "ClientSession_kujiId_fkey" FOREIGN KEY ("kujiId") REFERENCES "Kuji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawLog" ADD CONSTRAINT "DrawLog_kujiId_fkey" FOREIGN KEY ("kujiId") REFERENCES "Kuji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawLog" ADD CONSTRAINT "DrawLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClientSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawLog" ADD CONSTRAINT "DrawLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
