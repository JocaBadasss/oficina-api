// src/whatsapp/whatsapp.module.ts
import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';

@Module({
  imports: [ConfigModule],
  providers: [WhatsAppService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
