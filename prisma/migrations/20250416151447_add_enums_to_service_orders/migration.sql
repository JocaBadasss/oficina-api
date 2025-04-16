/*
  Warnings:

  - The `status` column on the `ServiceOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `fuelLevel` on the `ServiceOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `adblueLevel` on the `ServiceOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tireStatus` on the `ServiceOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mirrorStatus` on the `ServiceOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `paintingStatus` on the `ServiceOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FuelLevel" AS ENUM ('RESERVA', 'QUARTO', 'METADE', 'TRES_QUARTOS', 'CHEIO');

-- CreateEnum
CREATE TYPE "AdblueLevel" AS ENUM ('VAZIO', 'BAIXO', 'METADE', 'CHEIO');

-- CreateEnum
CREATE TYPE "TireStatus" AS ENUM ('RUIM', 'REGULAR', 'BOM', 'NOVO');

-- CreateEnum
CREATE TYPE "MirrorStatus" AS ENUM ('OK', 'QUEBRADO', 'RACHADO', 'FALTANDO');

-- CreateEnum
CREATE TYPE "PaintingStatus" AS ENUM ('INTACTA', 'ARRANHADA', 'AMASSADA', 'REPARADA');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('AGUARDANDO', 'EM_ANDAMENTO', 'FINALIZADO');

-- AlterTable
ALTER TABLE "ServiceOrder" DROP COLUMN "fuelLevel",
ADD COLUMN     "fuelLevel" "FuelLevel" NOT NULL,
DROP COLUMN "adblueLevel",
ADD COLUMN     "adblueLevel" "AdblueLevel" NOT NULL,
DROP COLUMN "tireStatus",
ADD COLUMN     "tireStatus" "TireStatus" NOT NULL,
DROP COLUMN "mirrorStatus",
ADD COLUMN     "mirrorStatus" "MirrorStatus" NOT NULL,
DROP COLUMN "paintingStatus",
ADD COLUMN     "paintingStatus" "PaintingStatus" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ServiceStatus" NOT NULL DEFAULT 'AGUARDANDO';
