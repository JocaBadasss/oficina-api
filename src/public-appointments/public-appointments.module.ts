import { Module } from '@nestjs/common';
import { PublicAppointmentsService } from './public-appointments.service';
import { PublicAppointmentsController } from './public-appointments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicAppointmentsController],
  providers: [PublicAppointmentsService],
})
export class PublicAppointmentsModule {}
