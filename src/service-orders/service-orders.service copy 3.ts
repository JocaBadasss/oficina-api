import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateFullServiceOrderDto } from './dto/CreateFullServiceOrderDto';
import {
  FuelLevel,
  AdblueLevel,
  TireStatus,
  MirrorStatus,
  PaintingStatus,
} from './dto/create-service-order.dto';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: CreateServiceOrderDto) {
    const existingOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: {
          in: ['AGUARDANDO', 'EM_ANDAMENTO'],
        },
      },
    });

    if (existingOrder) {
      throw new ConflictException({
        code: 'ORDER_ALREADY_EXISTS',
        field: 'vehicleId',
        message: 'Já existe uma ordem em andamento para este veículo.',
      });
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: { client: true },
    });

    if (!vehicle) {
      throw new NotFoundException({
        code: 'VEHICLE_NOT_FOUND',
        field: 'vehicleId',
        message: 'Veículo não encontrado para esta ordem de serviço.',
      });
    }

    const serviceOrder = await this.prisma.serviceOrder.create({
      data,
    });

    // 🚨 Dispara notificação automática
    const phone = vehicle.client?.phone;
    if (!phone) {
      throw new ConflictException({
        code: 'MISSING_PHONE',
        field: 'client.phone',
        message:
          'Cliente não possui número de telefone cadastrado para envio de notificação.',
      });
    }

    const message = `🚗 O veículo ${vehicle.plate} teve uma nova ordem de serviço criada.\n\nAcompanhe o andamento nesse link:\n\nhttps://app.oficina.com/acompanhamento/${serviceOrder.id}`;

    await this.notificationsService.createAuto(serviceOrder.id, message);

    return serviceOrder;
  }

  findAll() {
    return this.prisma.serviceOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            year: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            plate: true,
            brand: true,
            model: true,
            year: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        field: 'id',
        message: 'Ordem de serviço não encontrada.',
      });
    }

    return order;
  }

  async update(id: string, data: UpdateServiceOrderDto) {
    const existingOrder = await this.findOne(id);

    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data,
    });

    if (data.status && data.status !== existingOrder.status) {
      const formattedStatus = data.status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, (l) => l.toUpperCase());

      const msg = `🔧 O status da ordem foi alterado para: ${formattedStatus}`;
      await this.notificationsService.createAuto(id, msg);
    }

    return updatedOrder;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.serviceOrder.delete({
      where: { id },
    });
  }

  async createFull(dto: CreateFullServiceOrderDto) {
    try {
      return this.prisma.$transaction(async (tx) => {
        let clientId = dto.clientId?.trim();

        // 👉 Verifica se vai criar cliente
        if (!clientId) {
          const rawDoc = dto.cpfOrCnpj?.replace(/\D/g, '') || '';

          if (!dto.name || !dto.email || !dto.phone || !rawDoc) {
            throw new BadRequestException(
              'Dados incompletos para criação do cliente.',
            );
          }

          // Verifica duplicação
          const existingClient = await tx.client.findFirst({
            where: { cpfOrCnpj: rawDoc },
          });

          if (existingClient) {
            clientId = existingClient.id;
          } else {
            const client = await tx.client.create({
              data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                cpfOrCnpj: rawDoc,
              },
            });

            clientId = client.id;
          }
        }

        let vehicleId = dto.vehicleId?.trim();

        if (!vehicleId) {
          if (!dto.plate) {
            throw new BadRequestException('Placa do veículo é obrigatória.');
          }

          const plate = dto.plate.replace('-', '').toUpperCase().trim();

          // 🔎 Verifica se já existe veículo com essa placa no sistema inteiro
          const existingVehicle = await tx.vehicle.findUnique({
            where: { plate },
          });

          if (existingVehicle) {
            throw new ConflictException({
              code: 'DUPLICATE_PLATE',
              field: 'plate',
              message: 'Esta placa já está cadastrada em outro cliente.',
            });
          }

          // ✅ Cria veículo normalmente se não existir
          const vehicle = await tx.vehicle.create({
            data: {
              plate,
              brand: dto.brand,
              model: dto.model,
              year: dto.year,
              clientId,
            },
          });

          vehicleId = vehicle.id;
        }

        // 👉 Criação da ordem de serviço
        const order = await tx.serviceOrder.create({
          data: {
            vehicleId,
            complaints: dto.complaints,
            ...(dto.notes && { notes: dto.notes }),
            ...(dto.km !== undefined && { km: dto.km }),
            ...(dto.fuelLevel && { fuelLevel: dto.fuelLevel as FuelLevel }),
            ...(dto.adblueLevel && {
              adblueLevel: dto.adblueLevel as AdblueLevel,
            }),
            ...(dto.tireStatus && {
              tireStatus: dto.tireStatus as TireStatus,
            }),
            ...(dto.mirrorStatus && {
              mirrorStatus: dto.mirrorStatus as MirrorStatus,
            }),
            ...(dto.paintingStatus && {
              paintingStatus: dto.paintingStatus as PaintingStatus,
            }),
          },
        });

        return {
          message: 'Atendimento criado com sucesso.',
          orderId: order.id,
        };
      });
    } catch (error) {
      console.error('Erro inesperado em /service-orders/full', error);
      throw new InternalServerErrorException(
        'Erro inesperado. Tente novamente.',
      );
    }
  }
}
