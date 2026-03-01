-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMember" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "CampaignMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "armorClass" INTEGER NOT NULL,
    "proficiencyBonus" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "raceId" TEXT,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbilityScore" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,

    CONSTRAINT "AbilityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "raceId" TEXT,
    "classId" TEXT,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterFeature" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,

    CONSTRAINT "CharacterFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hitDie" INTEGER NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterClass" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "CharacterClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterItem" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CharacterItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatSession" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "round" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CombatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CombatAction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT,
    "actionType" TEXT NOT NULL,
    "attackRoll" INTEGER,
    "damageDealt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CombatAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Campaign_ownerId_idx" ON "Campaign"("ownerId");

-- CreateIndex
CREATE INDEX "CampaignMember_campaignId_idx" ON "CampaignMember"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignMember_userId_idx" ON "CampaignMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMember_campaignId_userId_key" ON "CampaignMember"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "Character_userId_idx" ON "Character"("userId");

-- CreateIndex
CREATE INDEX "Character_campaignId_idx" ON "Character"("campaignId");

-- CreateIndex
CREATE INDEX "Character_raceId_idx" ON "Character"("raceId");

-- CreateIndex
CREATE UNIQUE INDEX "AbilityScore_characterId_key" ON "AbilityScore"("characterId");

-- CreateIndex
CREATE INDEX "Feature_raceId_idx" ON "Feature"("raceId");

-- CreateIndex
CREATE INDEX "Feature_classId_idx" ON "Feature"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterFeature_characterId_featureId_key" ON "CharacterFeature"("characterId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterClass_characterId_classId_key" ON "CharacterClass"("characterId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterItem_characterId_itemId_key" ON "CharacterItem"("characterId", "itemId");

-- CreateIndex
CREATE INDEX "CombatSession_campaignId_idx" ON "CombatSession"("campaignId");

-- CreateIndex
CREATE INDEX "CombatSession_active_idx" ON "CombatSession"("active");

-- CreateIndex
CREATE INDEX "CombatAction_sessionId_idx" ON "CombatAction"("sessionId");

-- CreateIndex
CREATE INDEX "CombatAction_actorId_idx" ON "CombatAction"("actorId");

-- CreateIndex
CREATE INDEX "CombatAction_targetId_idx" ON "CombatAction"("targetId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbilityScore" ADD CONSTRAINT "AbilityScore_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeature" ADD CONSTRAINT "CharacterFeature_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterFeature" ADD CONSTRAINT "CharacterFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterClass" ADD CONSTRAINT "CharacterClass_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterClass" ADD CONSTRAINT "CharacterClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterItem" ADD CONSTRAINT "CharacterItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterItem" ADD CONSTRAINT "CharacterItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatSession" ADD CONSTRAINT "CombatSession_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CombatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
