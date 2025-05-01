// src/users/users.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    isAdmin: boolean;
  };
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.usersService.findById(userId);
  }
}
