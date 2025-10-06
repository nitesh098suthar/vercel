-- CreateEnum
CREATE TYPE "MarkedBy" AS ENUM ('SELF', 'OWNER');

-- AlterTable
ALTER TABLE "TeacherAttendance" ADD COLUMN     "location" TEXT,
ADD COLUMN     "markedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "markedBy" "MarkedBy";
