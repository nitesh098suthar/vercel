/*
  Warnings:

  - You are about to drop the column `classTeacherId` on the `Class` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_classTeacherId_fkey";

-- DropIndex
DROP INDEX "Class_classTeacherId_key";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "classTeacherId";
