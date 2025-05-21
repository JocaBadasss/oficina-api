/*
  Warnings:

  - You are about to drop the column `cnpj` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `Client` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpfOrCnpj]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Client_cnpj_key";

-- DropIndex
DROP INDEX "Client_cpf_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "cnpj",
DROP COLUMN "cpf",
ADD COLUMN     "cpfOrCnpj" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_cpfOrCnpj_key" ON "Client"("cpfOrCnpj");
