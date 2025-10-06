/*
  Warnings:

  - Made the column `sectionId` on table `Schedule` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_sectionId_fkey";

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "sectionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
