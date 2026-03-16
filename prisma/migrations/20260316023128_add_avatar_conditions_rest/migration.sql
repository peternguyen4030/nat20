-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('BLINDED', 'CHARMED', 'DEAFENED', 'EXHAUSTION', 'FRIGHTENED', 'GRAPPLED', 'INCAPACITATED', 'INVISIBLE', 'PARALYZED', 'PETRIFIED', 'POISONED', 'PRONE', 'RESTRAINED', 'STUNNED', 'UNCONSCIOUS');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "bannerUrl" TEXT;

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "conditions" "Condition"[],
ADD COLUMN     "deathSaves" JSONB,
ADD COLUMN     "hitDice" JSONB,
ADD COLUMN     "initiative" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "spellSlots" JSONB,
ADD COLUMN     "temporaryHp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT;
