import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';
import {
  startOfHour,
  endOfHour,
  isWeekend,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  parseISO,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ClientsService } from 'src/clients/clients.service';

@Injectable()
export class PublicAppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private clientsService: ClientsService,
  ) {}

  async getAvailableSlots(dateStr: string): Promise<string[]> {
    if (!dateStr) {
      throw new BadRequestException('Data não informada');
    }

    const date = parseISO(dateStr);
    if (isWeekend(date)) {
      throw new BadRequestException('Sem agendamentos em fins de semana');
    }

    const slots: string[] = [];

    for (let hour = 8; hour <= 17; hour++) {
      const local = setMilliseconds(
        setSeconds(setMinutes(setHours(date, hour), 0), 0),
        0,
      );

      const start = startOfHour(local);
      const end = endOfHour(local);

      const existing = await this.prisma.appointment.findFirst({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      if (!existing) {
        slots.push(format(local, 'HH:mm', { locale: ptBR }));
      }
    }

    return slots;
  }

  async create(dto: CreatePublicAppointmentDto) {
    const date = new Date(dto.date);

    if (date.getHours() < 8 || date.getHours() > 17) {
      throw new BadRequestException('Horário fora do expediente');
    }

    if (isWeekend(date)) {
      throw new BadRequestException('Não agendamos aos fins de semana');
    }

    const existingSlot = await this.prisma.appointment.findFirst({
      where: { date },
    });

    if (existingSlot) {
      throw new ConflictException('Horário já reservado');
    }

    // 🔍 Verifica se já existe cliente com o mesmo CPF ou CNPJ
    let client = await this.prisma.client.findFirst({
      where: {
        cpfOrCnpj: dto.cpfOrCnpj,
      },
    });

    if (!client) {
      client = await this.clientsService.createFromAppointment({
        name: dto.name,
        phone: dto.phone,
        cpfOrCnpj: dto.cpfOrCnpj,
      });
    }

    if (!client) {
      throw new BadRequestException(
        'Erro inesperado: cliente não foi criado nem encontrado.',
      );
    }

    // 🔍 Normaliza a placa antes de buscar/criar
    const normalizedPlate = dto.plate.replace('-', '').toUpperCase();

    // 🔍 Busca veículo
    let vehicle = await this.prisma.vehicle.findFirst({
      where: {
        plate: normalizedPlate,
        clientId: client.id,
      },
    });

    if (!vehicle) {
      vehicle = await this.prisma.vehicle.create({
        data: {
          clientId: client.id,
          plate: normalizedPlate,
          brand: dto.brand,
          model: dto.model,
          year: dto.year,
        },
      });
    }

    // 🔍 Verifica se esse veículo já tem agendamento neste horário
    const sameVehicleSameDate = await this.prisma.appointment.findFirst({
      where: {
        vehicleId: vehicle.id,
        date,
      },
    });

    if (sameVehicleSameDate) {
      throw new ConflictException(
        'Este veículo já está agendado para este horário',
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        vehicleId: vehicle.id,
        date,
        notes: dto.notes,
      },
    });

    await this.notificationsService.createWithoutOrder(
      client.id,
      `📅 Olá ${client.name}, seu agendamento para o dia ${format(
        date,
        'dd/MM/yyyy HH:mm',
      )} foi confirmado!`,
    );

    return appointment;
  }
}
