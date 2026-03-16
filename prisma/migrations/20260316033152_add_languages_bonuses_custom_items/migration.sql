-- DropForeignKey
ALTER TABLE "CharacterItem" DROP CONSTRAINT "CharacterItem_itemId_fkey";

-- DropIndex
DROP INDEX "CharacterItem_characterId_itemId_key";

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "savingThrowBonuses" JSONB,
ADD COLUMN     "skillBonuses" JSONB;

-- AlterTable
ALTER TABLE "CharacterItem" ADD COLUMN     "customDescription" TEXT,
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "customType" TEXT,
ALTER COLUMN "itemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CharacterItem" ADD CONSTRAINT "CharacterItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
