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

@Injectable()
export class PublicAppointmentsService {
  constructor(private prisma: PrismaService) {}

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
        OR: [{ cpf: dto.cpf ?? undefined }, { cnpj: dto.cnpj ?? undefined }],
      },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          cpf: dto.cpf ?? null,
          cnpj: dto.cnpj ?? null,
          email: `${dto.phone.replace(/\D/g, '')}@auto.fake`,
          address: '-',
          isExternal: true,
        },
      });
    }

    // 🔍 Busca veículo
    let vehicle = await this.prisma.vehicle.findFirst({
      where: {
        plate: dto.plate,
        clientId: client.id,
      },
    });

    if (!vehicle) {
      vehicle = await this.prisma.vehicle.create({
        data: {
          clientId: client.id,
          plate: dto.plate,
          brand: dto.brand,
          model: dto.model,
          year: dto.year,
        },
      });
    }

    return this.prisma.appointment.create({
      data: {
        vehicleId: vehicle.id,
        date,
        notes: dto.notes,
      },
    });
  }
}
