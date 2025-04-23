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
    return this.client.messages.create({
      from: this.from,
      to: `whatsapp:+55${to}`,
      body: message,
    });
  }
}
