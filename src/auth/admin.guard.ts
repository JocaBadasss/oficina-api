// src/auth/admin.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedUser {
  id: string;
  isAdmin: boolean;
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();

    const user = request.user;

    if (!user?.isAdmin) {
      throw new ForbiddenException('Acesso restrito a administradores');
    }

    return true;
  }
}
