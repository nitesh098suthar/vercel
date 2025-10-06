/*
  Warnings:

  - A unique constraint covering the columns `[guardianPhone]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_guardianPhone_key" ON "Student"("guardianPhone");
