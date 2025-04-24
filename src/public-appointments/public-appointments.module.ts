import { Module } from '@nestjs/common';
import { PublicAppointmentsService } from './public-appointments.service';
import { PublicAppointmentsController } from './public-appointments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PublicAppointmentsController],
  providers: [PublicAppointmentsService],
})
export class PublicAppointmentsModule {}
