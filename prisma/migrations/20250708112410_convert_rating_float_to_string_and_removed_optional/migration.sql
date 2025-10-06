/*
  Warnings:

  - Made the column `recommendedAge` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `instructions` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `brand` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "weight" SET DATA TYPE TEXT,
ALTER COLUMN "numberOfPieces" SET DATA TYPE TEXT,
ALTER COLUMN "recommendedAge" SET NOT NULL,
ALTER COLUMN "instructions" SET NOT NULL,
ALTER COLUMN "itemsInBox" SET DATA TYPE TEXT,
ALTER COLUMN "brand" SET NOT NULL,
ALTER COLUMN "rating" DROP DEFAULT,
ALTER COLUMN "rating" SET DATA TYPE TEXT,
ALTER COLUMN "totalReviews" DROP DEFAULT,
ALTER COLUMN "totalReviews" SET DATA TYPE TEXT,
ALTER COLUMN "totalItemsSold" SET DATA TYPE TEXT;
