/*
  Warnings:

  - You are about to drop the column `IsLovedByKids` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `isPitara` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `isPopular` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `levelId` on the `Item` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Level` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_levelId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "IsLovedByKids",
DROP COLUMN "category",
DROP COLUMN "isPitara",
DROP COLUMN "isPopular",
DROP COLUMN "levelId";

-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ItemCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ItemCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ItemTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ItemTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ItemLevels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ItemLevels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "_ItemCategories_B_index" ON "_ItemCategories"("B");

-- CreateIndex
CREATE INDEX "_ItemTags_B_index" ON "_ItemTags"("B");

-- CreateIndex
CREATE INDEX "_ItemLevels_B_index" ON "_ItemLevels"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Level_name_key" ON "Level"("name");

-- AddForeignKey
ALTER TABLE "_ItemCategories" ADD CONSTRAINT "_ItemCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemCategories" ADD CONSTRAINT "_ItemCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTags" ADD CONSTRAINT "_ItemTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTags" ADD CONSTRAINT "_ItemTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemLevels" ADD CONSTRAINT "_ItemLevels_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemLevels" ADD CONSTRAINT "_ItemLevels_B_fkey" FOREIGN KEY ("B") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
