/*
  Warnings:

  - Added the required column `serviceCharge` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- Backfill existing orders before enforcing the required column.
ALTER TABLE "Order" ADD COLUMN     "serviceCharge" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ALTER COLUMN "serviceCharge" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "serviceChargeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
ADD COLUMN     "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.0500;
