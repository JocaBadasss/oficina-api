import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      isAdmin: user.isAdmin,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refresh(userId: string, isAdmin: boolean) {
    const payload = { sub: userId, isAdmin };

    const newAcessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    return { accessToken: newAcessToken };
  }
}
