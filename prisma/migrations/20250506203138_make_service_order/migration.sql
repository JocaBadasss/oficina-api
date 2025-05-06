/*
  Warnings:

  - Made the column `complaints` on table `ServiceOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ServiceOrder" ALTER COLUMN "km" DROP NOT NULL,
ALTER COLUMN "complaints" SET NOT NULL,
ALTER COLUMN "fuelLevel" DROP NOT NULL,
ALTER COLUMN "adblueLevel" DROP NOT NULL,
ALTER COLUMN "tireStatus" DROP NOT NULL,
ALTER COLUMN "mirrorStatus" DROP NOT NULL,
ALTER COLUMN "paintingStatus" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "brand" DROP NOT NULL,
ALTER COLUMN "model" DROP NOT NULL,
ALTER COLUMN "year" DROP NOT NULL;
