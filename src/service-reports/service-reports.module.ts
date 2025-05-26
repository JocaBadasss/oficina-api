import { Module } from '@nestjs/common';
import { ServiceReportsController } from './service-reports.controller';
import { ServiceReportsService } from './service-reports.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PhotosModule } from 'src/photos/photos.module';

@Module({
  imports: [PrismaModule, NotificationsModule, PhotosModule],
  controllers: [ServiceReportsController],
  providers: [ServiceReportsService],
})
export class ServiceReportsModule {}
