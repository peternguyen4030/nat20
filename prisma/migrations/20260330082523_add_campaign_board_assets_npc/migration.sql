/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LogActionType" AS ENUM ('COMBAT_ATTACK', 'COMBAT_SPELL', 'COMBAT_MOVE', 'COMBAT_OTHER', 'LEVEL_UP', 'INSPIRATION_AWARDED', 'INSPIRATION_SPENT', 'HP_CHANGE', 'CAMPAIGN_EVENT');

-- CreateEnum
CREATE TYPE "CampaignAssetType" AS ENUM ('MAP', 'TOKEN');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "inviteCode" TEXT;

-- AlterTable
ALTER TABLE "CombatAction" ADD COLUMN     "npcActorId" TEXT,
ADD COLUMN     "npcTargetId" TEXT;

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "characterId" TEXT,
    "actionType" "LogActionType" NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignBoard" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "activeMapId" TEXT,
    "boardState" JSONB,
    "combatActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAsset" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "CampaignAssetType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPC" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "armorClass" INTEGER NOT NULL DEFAULT 10,
    "speed" INTEGER NOT NULL DEFAULT 30,
    "initiativeModifier" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,
    "attacks" JSONB,
    "conditions" "Condition"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NPC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionLog_campaignId_idx" ON "ActionLog"("campaignId");

-- CreateIndex
CREATE INDEX "ActionLog_sessionId_idx" ON "ActionLog"("sessionId");

-- CreateIndex
CREATE INDEX "ActionLog_userId_idx" ON "ActionLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBoard_campaignId_key" ON "CampaignBoard"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignBoard_campaignId_idx" ON "CampaignBoard"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignAsset_campaignId_idx" ON "CampaignAsset"("campaignId");

-- CreateIndex
CREATE INDEX "NPC_campaignId_idx" ON "NPC"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_inviteCode_key" ON "Campaign"("inviteCode");

-- CreateIndex
CREATE INDEX "CombatAction_npcActorId_idx" ON "CombatAction"("npcActorId");

-- CreateIndex
CREATE INDEX "CombatAction_npcTargetId_idx" ON "CombatAction"("npcTargetId");

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CombatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_npcActorId_fkey" FOREIGN KEY ("npcActorId") REFERENCES "NPC"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_npcTargetId_fkey" FOREIGN KEY ("npcTargetId") REFERENCES "NPC"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignBoard" ADD CONSTRAINT "CampaignBoard_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignBoard" ADD CONSTRAINT "CampaignBoard_activeMapId_fkey" FOREIGN KEY ("activeMapId") REFERENCES "CampaignAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAsset" ADD CONSTRAINT "CampaignAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NPC" ADD CONSTRAINT "NPC_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
