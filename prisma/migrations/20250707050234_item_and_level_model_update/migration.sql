/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `levelId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalItemsSold` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_categoryId_fkey";

-- DropIndex
DROP INDEX "Item_slug_key";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "categoryId",
DROP COLUMN "slug",
DROP COLUMN "stock",
ADD COLUMN     "IsLovedByKids" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "isPitara" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "levelId" TEXT NOT NULL,
ADD COLUMN     "totalItemsSold" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
