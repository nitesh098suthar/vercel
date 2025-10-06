-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('owner', 'teacher', 'student', 'super_admin');

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "role" "RoleType" NOT NULL DEFAULT 'owner';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "role" "RoleType" NOT NULL DEFAULT 'student';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "role" "RoleType" NOT NULL DEFAULT 'teacher';
