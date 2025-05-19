import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class WhatsAppService {
  private client: Twilio;
  private from: string;

  constructor(private config: ConfigService) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !from) {
      throw new Error('Credenciais do Twilio não configuradas corretamente.');
    }

    this.client = new Twilio(accountSid, authToken);
    this.from = from;
  }

  async sendMessage(to: string, message: string) {
    const cleanedTo = to.replace(/\D/g, '');

    if (cleanedTo.length !== 11) {
      throw new Error(
        `Número inválido: esperado 11 dígitos (DDD + número), recebido ${cleanedTo.length}.`,
      );
    }

    // Remove o terceiro dígito (geralmente o 9 depois do DDD)
    const adjustedTo = cleanedTo.slice(0, 2) + cleanedTo.slice(3);

    if (adjustedTo.length !== 10) {
      throw new Error(
        `Número ajustado inválido: esperado 10 dígitos (DDD + número sem 9), mas ficou com ${adjustedTo.length}.`,
      );
    }

    return this.client.messages.create({
      from: this.from,
      to: `whatsapp:+55${adjustedTo}`,
      body: message,
    });
  }
}
