import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly service: TrackingService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);

    if (!data) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    return data;
  }
}
