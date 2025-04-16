-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fuelLevel" TEXT NOT NULL,
    "adblueLevel" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "tireStatus" TEXT NOT NULL,
    "mirrorStatus" TEXT NOT NULL,
    "paintingStatus" TEXT NOT NULL,
    "complaints" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Aguardando',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
