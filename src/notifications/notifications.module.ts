import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { WhatsAppController } from './whatsapp/whatsapp.controller';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsAppModule],
  controllers: [NotificationsController, WhatsAppController],
  providers: [NotificationsService, WhatsAppService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
