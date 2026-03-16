-- CreateEnum
CREATE TYPE "ActionCategory" AS ENUM ('ATTACK', 'DAMAGING', 'HEALING', 'SUPPORT', 'DEFENSIVE', 'MOVEMENT', 'UTILITY');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ACTION', 'BONUS_ACTION', 'REACTION', 'FREE', 'PASSIVE');

-- CreateEnum
CREATE TYPE "SpellCategory" AS ENUM ('DAMAGING', 'HEALING', 'CONTROL', 'BUFF', 'DEBUFF', 'UTILITY', 'DEFENSE');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "bond" TEXT,
ADD COLUMN     "flaw" TEXT,
ADD COLUMN     "ideal" TEXT,
ADD COLUMN     "personalityTrait" TEXT;

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "actionType" "ActionType",
ADD COLUMN     "category" "ActionCategory",
ADD COLUMN     "combatUsable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Spell" ADD COLUMN     "category" "SpellCategory" NOT NULL DEFAULT 'UTILITY';
