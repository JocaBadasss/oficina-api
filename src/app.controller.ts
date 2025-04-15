import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Request } from 'express';

@Controller()
export class AppController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() request: Request) {
    return request.user; // Aqui vai estar { id, isAdmin }
  }
}
