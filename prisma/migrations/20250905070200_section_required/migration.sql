/*
  Warnings:

  - A unique constraint covering the columns `[classTeacherId]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "classTeacherId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Section_classTeacherId_key" ON "Section"("classTeacherId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
