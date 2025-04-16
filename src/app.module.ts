import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { ServiceReportsModule } from './service-reports/service-reports.module';
import { PhotosModule } from './photos/photos.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClientsModule,
    VehiclesModule,
    ServiceOrdersModule,
    ServiceReportsModule,
    PhotosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
