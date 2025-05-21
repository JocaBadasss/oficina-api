import { Injectable, NotFoundException } from '@nestjs/common';
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

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        field: 'orderId',
        message: 'Ordem de serviço não encontrada para envio de notificação.',
      });
    }

    if (!order.vehicle?.client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        field: 'vehicle.client',
        message: 'Cliente não encontrado para o veículo vinculado à OS.',
      });
    }

    const client = order.vehicle.client;

    const notification = await this.prisma.notification.create({
      data: {
        clientId: client.id,
        orderId: order.id,
        message,
        sent: false,
      },
    });

    try {
      const result = await this.whatsappService.sendMessage(
        client.phone,
        message,
      );

      console.log('📲 Resposta do WhatsApp:', result);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { sent: true },
      });
    } catch (err) {
      console.error('❌ Falha ao enviar WhatsApp:', (err as Error).message);
    }
  }

  async createWithoutOrder(clientId: string, message: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        field: 'clientId',
        message: 'Cliente não encontrado para envio de notificação.',
      });
    }

    const notification = await this.prisma.notification.create({
      data: {
        clientId,
        message,
        sent: false,
      },
    });

    try {
      await this.whatsappService.sendMessage(client.phone, message);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { sent: true },
      });
    } catch (err) {
      console.error('❌ Erro ao enviar WhatsApp:', (err as Error).message);
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
