import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

import {
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isWeekend,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: CreateAppointmentDto) {
    const timeZone = 'America/Sao_Paulo';
    const localDate = toZonedTime(new Date(data.date), timeZone);
    const hour = localDate.getHours();

    if (hour < 8 || hour > 17) {
      throw new BadRequestException({
        code: 'OUT_OF_BUSINESS_HOURS',
        field: 'date',
        message: 'Horário fora do expediente (08h às 17h).',
      });
    }

    if (isWeekend(localDate)) {
      throw new BadRequestException({
        code: 'WEEKEND_NOT_ALLOWED',
        field: 'date',
        message: 'Agendamentos apenas de segunda a sexta.',
      });
    }

    const start = new Date(localDate);
    start.setMinutes(0, 0, 0);
    const end = new Date(localDate);
    end.setMinutes(59, 59, 999);

    const existing = await this.prisma.appointment.findFirst({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'TIME_SLOT_OCCUPIED',
        field: 'date',
        message: 'Horário já está ocupado.',
      });
    }

    const existingForVehicle = await this.prisma.appointment.findFirst({
      where: {
        vehicleId: data.vehicleId,
        date: { gte: new Date() },
      },
    });

    if (existingForVehicle) {
      throw new ConflictException({
        code: 'VEHICLE_ALREADY_SCHEDULED',
        field: 'vehicleId',
        message: 'Este veículo já possui um agendamento futuro.',
      });
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        vehicleId: data.vehicleId,
        date: localDate,
        notes: data.notes,
      },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
      },
    });

    const client = appointment.vehicle.client;

    if (!client || !client.phone) {
      throw new ConflictException({
        code: 'MISSING_CLIENT_PHONE',
        field: 'client.phone',
        message: 'Cliente não possui telefone para envio da notificação.',
      });
    }

    const dateStr = format(localDate, "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });

    const message = `Olá, ${client.name}! 📆 Seu agendamento foi confirmado para ${dateStr}.`;

    await this.notificationsService.createWithoutOrder(client.id, message);

    return appointment;
  }

  findAll() {
    return this.prisma.appointment.findMany({
      orderBy: { date: 'asc' },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            client: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            client: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        field: 'id',
        message: 'Agendamento não encontrado.',
      });
    }

    return appointment;
  }

  async update(id: string, data: UpdateAppointmentDto) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  async getAvailableSlots(dateStr: string): Promise<string[]> {
    if (!dateStr) {
      throw new BadRequestException({
        code: 'MISSING_DATE',
        field: 'date',
        message: 'Data não informada.',
      });
    }

    const timeZone = 'America/Sao_Paulo';
    const parsedDate = parseISO(dateStr);
    const localDate = toZonedTime(parsedDate, timeZone);

    if (isWeekend(localDate)) {
      throw new BadRequestException({
        code: 'WEEKEND_NOT_ALLOWED',
        field: 'date',
        message: 'Não há expediente em finais de semana.',
      });
    }

    const availableSlots: string[] = [];

    for (let hour = 8; hour <= 17; hour++) {
      const local = setMilliseconds(
        setSeconds(setMinutes(setHours(localDate, hour), 0), 0),
        0,
      );

      const start = new Date(local);
      start.setMinutes(0, 0, 0);

      const end = new Date(local);
      end.setMinutes(59, 59, 999);

      const existing = await this.prisma.appointment.findFirst({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      if (!existing) {
        availableSlots.push(format(local, 'HH:mm', { locale: ptBR }));
      }
    }

    return availableSlots;
  }

  async convertToOrder(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: 'APPOINTMENT_NOT_FOUND',
        field: 'appointmentId',
        message: 'Agendamento não encontrado.',
      });
    }

    if (appointment.status === 'CONCLUIDO') {
      throw new ConflictException({
        code: 'APPOINTMENT_ALREADY_FINISHED',
        field: 'appointmentId',
        message: 'Este agendamento já foi concluído.',
      });
    }

    const order = await this.prisma.serviceOrder.create({
      data: {
        vehicleId: appointment.vehicleId,
        fuelLevel: 'RESERVA',
        adblueLevel: 'VAZIO',
        km: 0,
        tireStatus: 'RUIM',
        mirrorStatus: 'OK',
        paintingStatus: 'INTACTA',
        complaints: appointment.notes || '',
        notes: '',
      },
    });

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONCLUIDO' },
    });

    return order;
  }
}
