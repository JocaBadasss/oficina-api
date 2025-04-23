import { Controller, Get, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications') // 👈 ESSENCIAL
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('clients/:id')
  findClientNotifications(@Param('id') id: string) {
    return this.notificationsService.findByClientId(id);
  }
}
