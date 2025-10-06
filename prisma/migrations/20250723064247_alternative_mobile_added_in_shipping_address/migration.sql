-- AlterTable
ALTER TABLE "ShippingAddressForm" ADD COLUMN     "alternativeMobile" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'USER';
