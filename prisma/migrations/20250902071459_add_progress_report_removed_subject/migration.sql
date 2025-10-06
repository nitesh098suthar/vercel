/*
  Warnings:

  - You are about to drop the column `subjectId` on the `ProgressReport` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProgressReport" DROP CONSTRAINT "ProgressReport_subjectId_fkey";

-- AlterTable
ALTER TABLE "ProgressReport" DROP COLUMN "subjectId";
