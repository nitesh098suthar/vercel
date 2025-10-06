/*
  Warnings:

  - You are about to drop the column `shippingAddress` on the `Order` table. All the data in the column will be lost.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddressFormId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ONLINE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingAddress",
ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "shippingAddressFormId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PACKING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL;

-- CreateTable
CREATE TABLE "ShippingAddressForm" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "landmark" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingAddressForm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressFormId_fkey" FOREIGN KEY ("shippingAddressFormId") REFERENCES "ShippingAddressForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
