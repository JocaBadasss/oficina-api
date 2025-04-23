// src/whatsapp/whatsapp.controller.ts
import { Controller } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly service: WhatsAppService) {}
}
