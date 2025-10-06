/*
  Warnings:

  - The values [SHIPPING_IN_PROGRESS] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `totalPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PACKING', 'SHIPPED', 'DELIVERED', 'CANCELED');
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "price",
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
