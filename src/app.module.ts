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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppointmentsModule } from './appointments/appointments.module';
import { PublicAppointmentsModule } from './public-appointments/public-appointments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClientsModule,
    VehiclesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ServiceOrdersModule,
    ServiceReportsModule,
    PhotosModule,
    AppointmentsModule,
    PublicAppointmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
