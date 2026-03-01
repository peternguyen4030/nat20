/*
  Warnings:

  - The `role` column on the `CampaignMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[index]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[index]` on the table `Feature` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[index]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[index]` on the table `Race` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `index` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `actionType` on the `CombatAction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Feature` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `index` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Item` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `index` to the `Race` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CampaignMemberRole" AS ENUM ('DM', 'PLAYER');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('CLASS', 'RACE', 'FEAT', 'BACKGROUND');

-- CreateEnum
CREATE TYPE "CharacterSpellStatus" AS ENUM ('KNOWN', 'PREPARED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('WEAPON', 'ARMOR', 'CONSUMABLE', 'TOOL', 'GEAR', 'MAGIC_ITEM');

-- CreateEnum
CREATE TYPE "ActionSlot" AS ENUM ('ACTION', 'BONUS_ACTION', 'REACTION', 'FREE');

-- CreateEnum
CREATE TYPE "CombatActionType" AS ENUM ('ATTACK', 'CAST', 'DASH', 'DODGE', 'HELP', 'HIDE', 'READY', 'OTHER');

-- AlterTable
ALTER TABLE "AbilityScore" ALTER COLUMN "strength" SET DEFAULT 10,
ALTER COLUMN "dexterity" SET DEFAULT 10,
ALTER COLUMN "constitution" SET DEFAULT 10,
ALTER COLUMN "intelligence" SET DEFAULT 10,
ALTER COLUMN "wisdom" SET DEFAULT 10,
ALTER COLUMN "charisma" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "description" TEXT,
ADD COLUMN     "emoji" TEXT,
ADD COLUMN     "lastPlayedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CampaignMember" DROP COLUMN "role",
ADD COLUMN     "role" "CampaignMemberRole" NOT NULL DEFAULT 'PLAYER';

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "backgroundId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "inspiration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "speed" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "level" SET DEFAULT 1,
ALTER COLUMN "armorClass" SET DEFAULT 10,
ALTER COLUMN "proficiencyBonus" SET DEFAULT 2;

-- AlterTable
ALTER TABLE "CharacterClass" ALTER COLUMN "level" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "CharacterItem" ADD COLUMN     "attuned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "equipped" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "index" TEXT NOT NULL,
ADD COLUMN     "spellcastingAbility" TEXT;

-- AlterTable
ALTER TABLE "CombatAction" ADD COLUMN     "actionSlot" "ActionSlot" NOT NULL DEFAULT 'ACTION',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "spellId" TEXT,
DROP COLUMN "actionType",
ADD COLUMN     "actionType" "CombatActionType" NOT NULL;

-- AlterTable
ALTER TABLE "CombatSession" ADD COLUMN     "actionUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bonusActionUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentTurnCharacterId" TEXT,
ADD COLUMN     "reactionUsed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "index" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "FeatureType" NOT NULL;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "armorClass" INTEGER,
ADD COLUMN     "cost" TEXT,
ADD COLUMN     "damageDice" TEXT,
ADD COLUMN     "damageType" TEXT,
ADD COLUMN     "index" TEXT NOT NULL,
ADD COLUMN     "weaponRange" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION,
DROP COLUMN "type",
ADD COLUMN     "type" "ItemType" NOT NULL;

-- AlterTable
ALTER TABLE "Race" ADD COLUMN     "abilityBonuses" JSONB,
ADD COLUMN     "index" TEXT NOT NULL,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "speed" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "traitNames" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Subrace" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "description" TEXT,
    "abilityBonuses" JSONB,

    CONSTRAINT "Subrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subclass" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "Subclass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Background" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "feature" TEXT,
    "skillProficiencies" TEXT[],
    "languages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Background_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proficiency" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Proficiency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterProficiency" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "proficiencyId" TEXT NOT NULL,
    "expertise" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CharacterProficiency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spell" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "school" TEXT NOT NULL,
    "castingTime" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "higherLevels" TEXT,

    CONSTRAINT "Spell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSpell" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "status" "CharacterSpellStatus" NOT NULL DEFAULT 'KNOWN',

    CONSTRAINT "CharacterSpell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subrace_index_key" ON "Subrace"("index");

-- CreateIndex
CREATE INDEX "Subrace_raceId_idx" ON "Subrace"("raceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subclass_index_key" ON "Subclass"("index");

-- CreateIndex
CREATE INDEX "Subclass_classId_idx" ON "Subclass"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Background_index_key" ON "Background"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Proficiency_index_key" ON "Proficiency"("index");

-- CreateIndex
CREATE INDEX "CharacterProficiency_characterId_idx" ON "CharacterProficiency"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterProficiency_characterId_proficiencyId_key" ON "CharacterProficiency"("characterId", "proficiencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Spell_index_key" ON "Spell"("index");

-- CreateIndex
CREATE INDEX "CharacterSpell_characterId_idx" ON "CharacterSpell"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSpell_characterId_spellId_key" ON "CharacterSpell"("characterId", "spellId");

-- CreateIndex
CREATE INDEX "Character_backgroundId_idx" ON "Character"("backgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_index_key" ON "Class"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_index_key" ON "Feature"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Item_index_key" ON "Item"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Race_index_key" ON "Race"("index");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_backgroundId_fkey" FOREIGN KEY ("backgroundId") REFERENCES "Background"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subrace" ADD CONSTRAINT "Subrace_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subclass" ADD CONSTRAINT "Subclass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProficiency" ADD CONSTRAINT "CharacterProficiency_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProficiency" ADD CONSTRAINT "CharacterProficiency_proficiencyId_fkey" FOREIGN KEY ("proficiencyId") REFERENCES "Proficiency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSpell" ADD CONSTRAINT "CharacterSpell_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSpell" ADD CONSTRAINT "CharacterSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatAction" ADD CONSTRAINT "CombatAction_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE SET NULL ON UPDATE CASCADE;
