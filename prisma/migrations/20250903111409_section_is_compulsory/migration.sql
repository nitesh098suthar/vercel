/*
  Warnings:

  - Made the column `sectionId` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "sectionId" SET NOT NULL,
ALTER COLUMN "sectionId" SET DEFAULT 'your_default_section_id';

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
