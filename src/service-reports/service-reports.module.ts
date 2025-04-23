import { Module } from '@nestjs/common';
import { ServiceReportsController } from './service-reports.controller';
import { ServiceReportsService } from './service-reports.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ServiceReportsController],
  providers: [ServiceReportsService],
})
export class ServiceReportsModule {}
