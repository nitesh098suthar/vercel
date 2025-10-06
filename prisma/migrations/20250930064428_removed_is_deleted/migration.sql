/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `AssignmentNotification` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `LearningMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `LearningMaterialFile` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Notice` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Owner` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `ProgressReport` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `SubjectTeacher` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `TeacherAttendance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "AssignmentNotification" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "LearningMaterial" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "LearningMaterialFile" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Owner" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "ProgressReport" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "SubjectTeacher" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "TeacherAttendance" DROP COLUMN "isDeleted";
