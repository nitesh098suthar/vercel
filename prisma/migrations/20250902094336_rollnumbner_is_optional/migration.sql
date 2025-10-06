-- DropIndex
DROP INDEX "Student_rollNumber_key";

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "rollNumber" DROP NOT NULL;
