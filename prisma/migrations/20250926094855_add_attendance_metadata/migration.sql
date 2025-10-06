/*
  Warnings:

  - Made the column `location` on table `TeacherAttendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `markedAt` on table `TeacherAttendance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `markedBy` on table `TeacherAttendance` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TeacherAttendance" ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "location" SET DEFAULT 'Not Entered',
ALTER COLUMN "markedAt" SET NOT NULL,
ALTER COLUMN "markedBy" SET NOT NULL,
ALTER COLUMN "markedBy" SET DEFAULT 'OWNER';
