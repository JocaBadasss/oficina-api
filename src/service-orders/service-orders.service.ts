import {
  BadRequestException,
  ConflictException,
  HttpException,
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
import { Prisma } from '@prisma/client';
import { PhotosService } from 'src/photos/photos.service';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private photosService: PhotosService,
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
            client: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        report: {
          select: {
            description: true,
            createdAt: true,
          },
        },
        photos: {
          select: {
            id: true,
            filename: true,
            path: true,
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

    return {
      id: order.id,
      client: order.vehicle.client,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      fuelLevel: order.fuelLevel,
      adblueLevel: order.adblueLevel,
      km: order.km,
      tireStatus: order.tireStatus,
      mirrorStatus: order.mirrorStatus,
      paintingStatus: order.paintingStatus,
      complaints: order.complaints,
      vehicle: order.vehicle,
      report: order.report,
      photos: order.photos.map((photo) => ({
        id: photo.id,
        filename: photo.filename,
        url: `${process.env.APP_URL}/uploads/${photo.filename}`,
      })),
    };
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
      return await this.prisma.$transaction(async (tx) => {
        const clientId = await this.resolveOrCreateClient(dto, tx);
        const vehicleId = await this.resolveOrCreateVehicle(dto, clientId, tx);
        return await this.createServiceOrderAndNotify(dto, vehicleId, tx);
      });
    } catch (error) {
      console.error('Erro inesperado em /service-orders/full', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Erro inesperado. Tente novamente.',
      );
    }
  }

  private async resolveOrCreateClient(
    dto: CreateFullServiceOrderDto,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const clientId = dto.clientId?.trim();

    if (clientId) {
      const clientExists = await tx.client.findUnique({
        where: { id: clientId },
      });

      if (!clientExists) {
        throw new BadRequestException({
          code: 'INVALID_RELATION',
          field: 'clientId',
          message: 'Cliente não encontrado.',
        });
      }

      return clientId;
    }

    const { name, email, phone, cpfOrCnpj, address } = dto;

    if (!name || !email || !phone || !cpfOrCnpj) {
      throw new BadRequestException({
        code: 'INCOMPLETE_CLIENT_DATA',
        message: 'Nome, e-mail, telefone e CPF/CNPJ são obrigatórios.',
      });
    }

    const rawDoc = cpfOrCnpj.replace(/\D/g, '');

    // 🔍 Verifica duplicações
    const existingByDoc = await tx.client.findUnique({
      where: { cpfOrCnpj: rawDoc },
    });

    if (existingByDoc) return existingByDoc.id;

    const existingByEmail = await tx.client.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      throw new BadRequestException({
        code: 'DUPLICATE_FIELD',
        field: 'email',
        message: 'Já existe um cliente com este e-mail.',
      });
    }

    const existingByPhone = await tx.client.findUnique({
      where: { phone },
    });

    if (existingByPhone) {
      throw new BadRequestException({
        code: 'DUPLICATE_FIELD',
        field: 'phone',
        message: 'Já existe um cliente com este telefone.',
      });
    }

    const createdClient = await tx.client.create({
      data: {
        name,
        email,
        phone,
        address,
        cpfOrCnpj: rawDoc,
      },
    });

    return createdClient.id;
  }

  private async resolveOrCreateVehicle(
    dto: CreateFullServiceOrderDto,
    clientId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const vehicleId = dto.vehicleId?.trim();

    if (vehicleId) {
      const vehicleExists = await tx.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicleExists) {
        throw new NotFoundException({
          code: 'VEHICLE_NOT_FOUND',
          field: 'vehicleId',
          message: 'Veículo não encontrado.',
        });
      }

      if (vehicleExists.clientId !== clientId) {
        throw new ConflictException({
          code: 'INVALID_RELATION',
          field: 'vehicleId',
          message: 'Este veículo pertence a outro cliente.',
        });
      }

      return vehicleId;
    }

    if (!dto.plate) {
      throw new BadRequestException({
        code: 'MISSING_PLATE',
        field: 'plate',
        message: 'Placa do veículo é obrigatória.',
      });
    }

    const plate = dto.plate.replace('-', '').toUpperCase().trim();

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

    const clientExists = await tx.client.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      throw new BadRequestException({
        code: 'INVALID_RELATION',
        field: 'clientId',
        message: 'Cliente não encontrado para associar ao veículo.',
      });
    }

    const vehicle = await tx.vehicle.create({
      data: {
        plate,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        clientId,
      },
    });

    return vehicle.id;
  }

  private async createServiceOrderAndNotify(
    dto: CreateFullServiceOrderDto,
    vehicleId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ message: string; orderId: string }> {
    const existingOrder = await tx.serviceOrder.findFirst({
      where: {
        vehicleId,
        status: { in: ['AGUARDANDO', 'EM_ANDAMENTO'] },
      },
    });

    if (existingOrder) {
      throw new ConflictException({
        code: 'ORDER_ALREADY_EXISTS',
        field: 'vehicleId',
        message: 'Já existe uma ordem em andamento para este veículo.',
      });
    }

    const order = await tx.serviceOrder.create({
      data: {
        vehicleId,
        complaints: dto.complaints,
        ...(dto.notes && { notes: dto.notes }),
        ...(dto.km !== undefined && { km: dto.km }),
        ...(dto.fuelLevel && { fuelLevel: dto.fuelLevel as FuelLevel }),
        ...(dto.adblueLevel && { adblueLevel: dto.adblueLevel as AdblueLevel }),
        ...(dto.tireStatus && { tireStatus: dto.tireStatus as TireStatus }),
        ...(dto.mirrorStatus && {
          mirrorStatus: dto.mirrorStatus as MirrorStatus,
        }),
        ...(dto.paintingStatus && {
          paintingStatus: dto.paintingStatus as PaintingStatus,
        }),
      },
    });

    const vehicle = await tx.vehicle.findUnique({
      where: { id: vehicleId },
      include: { client: true },
    });

    if (!vehicle?.client?.phone) {
      throw new ConflictException({
        code: 'MISSING_PHONE',
        field: 'client.phone',
        message:
          'Cliente não possui número de telefone cadastrado para envio de notificação.',
      });
    }

    const message = `🚗 O veículo ${vehicle.plate} teve uma nova ordem de serviço criada.\n\nAcompanhe o andamento nesse link:\n\nhttps://app.oficina.com/acompanhamento/${order.id}`;

    await this.notificationsService.createAuto(order.id, message, tx);

    return {
      message: 'Atendimento criado com sucesso.',
      orderId: order.id,
    };
  }

  async createWithFiles(
    data: CreateServiceOrderDto,
    files: Express.Multer.File[],
  ) {
    const existingOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        vehicleId: data.vehicleId,
        status: { in: ['AGUARDANDO', 'EM_ANDAMENTO'] },
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

    const serviceOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.create({ data });

      console.log(order);

      if (files?.length) {
        for (const file of files) {
          await this.photosService.create(
            file.filename,
            file.path,
            order.id,
            tx,
          );
        }
      }

      return order;
    });

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

  async createOrderFullOptionalEntitiesWithPhotos(
    dto: CreateFullServiceOrderDto,
    files: Express.Multer.File[] = [],
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Resolver ou criar cliente
        const clientId = await this.resolveOrCreateClient(dto, tx);

        // 2. Resolver ou criar veículo
        const vehicleId = await this.resolveOrCreateVehicle(dto, clientId, tx);

        // 3. Criar ordem de serviço e notificar cliente
        const order = await this.createServiceOrderAndNotify(
          dto,
          vehicleId,
          tx,
        );

        // 4. Salvar fotos, se existirem
        if (files?.length) {
          for (const file of files) {
            await this.photosService.create(
              file.filename,
              file.path,
              order.orderId,
              tx,
            );
          }
        }

        // Retorna ordem criada com sucesso
        return order;
      });
    } catch (error) {
      console.error('Erro inesperado ao criar ordem completa:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Erro inesperado ao criar ordem completa. Tente novamente.',
      );
    }
  }

  async updateWithPhotos(
    id: string,
    dto: UpdateServiceOrderDto,
    files: Express.Multer.File[] = [],
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1) Buscar ordem existente
        const existingOrder = await tx.serviceOrder.findUnique({
          where: { id },
        });
        if (!existingOrder) {
          throw new NotFoundException({
            code: 'ORDER_NOT_FOUND',
            field: 'id',
            message: 'Ordem de serviço não encontrada.',
          });
        }

        // 2) Atualizar campos da ordem
        const { removePhotoIds, ...updateData } = dto;
        const updatedOrder = await tx.serviceOrder.update({
          where: { id },
          data: updateData,
        });

        // 3) Notificar mudança de status, se houver
        if (dto.status && dto.status !== existingOrder.status) {
          const formattedStatus = dto.status
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/^\w/, (l) => l.toUpperCase());
          const msg = `🔧 O status da ordem foi alterado para: ${formattedStatus}`;
          await this.notificationsService.createAuto(id, msg, tx);
        }

        // 4) Remover fotos antigas (se solicitado)
        if (removePhotoIds?.length) {
          for (const removeId of removePhotoIds) {
            // 1) confere se a foto existe e pertence a esta ordem
            const photoRecord = await tx.photo.findFirst({
              where: { id: removeId, orderId: id },
            });
            if (!photoRecord) {
              throw new BadRequestException({
                code: 'INVALID_PHOTO',
                field: 'removePhotoIds',
                message: `Foto ${removeId} não pertence a essa ordem.`,
              });
            }
            // 2) chama o service pra remover (DB + arquivo)
            await this.photosService.remove(removeId, tx);
          }
        }

        // 5) Incluir novas fotos
        if (files.length) {
          for (const file of files) {
            await this.photosService.create(file.filename, file.path, id, tx);
          }
        }

        return updatedOrder;
      });
    } catch (error) {
      // repassa exceções HTTP conhecidas
      if (error instanceof HttpException) throw error;
      // qualquer outro erro vira 500
      console.error('Erro ao atualizar ordem com fotos:', error);
      throw new InternalServerErrorException(
        'Erro inesperado ao atualizar ordem. Tente novamente.',
      );
    }
  }
}
