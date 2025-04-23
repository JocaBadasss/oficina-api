import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  async createAuto(orderId: string, message: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!order || !order.vehicle.client) return;

    const client = order.vehicle.client;

    // Cria notificação no banco
    const notification = await this.prisma.notification.create({
      data: {
        clientId: client.id,
        orderId: order.id,
        message,
        sent: false,
      },
    });

    // Envia via WhatsApp (sem template, mensagem simples)
    try {
      const result = await this.whatsappService.sendMessage(
        client.phone,
        message,
      );

      console.log('📲 Resposta do Twilio:', result);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { sent: true },
      });
    } catch (err) {
      if (err instanceof Error) {
        console.error('❌ Falha ao enviar WhatsApp:', err.message);
      } else {
        console.error('❌ Falha ao enviar WhatsApp:', String(err));
      }
    }
  }

  async findByClientId(clientId: string) {
    return this.prisma.notification.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
