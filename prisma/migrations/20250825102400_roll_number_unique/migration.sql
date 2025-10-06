/*
  Warnings:

  - A unique constraint covering the columns `[rollNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");
