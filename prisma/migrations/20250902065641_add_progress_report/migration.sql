-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY', 'SEMESTER', 'ANNUAL');

-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "performance" TEXT NOT NULL,
    "remark" TEXT,
    "grade" TEXT,
    "score" DOUBLE PRECISION,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
