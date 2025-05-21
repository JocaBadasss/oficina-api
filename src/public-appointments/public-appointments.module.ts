import { Module } from '@nestjs/common';
import { PublicAppointmentsService } from './public-appointments.service';
import { PublicAppointmentsController } from './public-appointments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ClientsService } from 'src/clients/clients.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PublicAppointmentsController],
  providers: [PublicAppointmentsService, ClientsService],
})
export class PublicAppointmentsModule {}
