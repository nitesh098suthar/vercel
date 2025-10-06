/*
  Warnings:

  - The `grade` column on the `ProgressReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `performance` on the `ProgressReport` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PerformanceType" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT');

-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('A_PLUS', 'A', 'B_PLUS', 'B', 'C_PLUS', 'C', 'D', 'F');

-- AlterTable
ALTER TABLE "ProgressReport" DROP COLUMN "performance",
ADD COLUMN     "performance" "PerformanceType" NOT NULL,
DROP COLUMN "grade",
ADD COLUMN     "grade" "GradeType";
