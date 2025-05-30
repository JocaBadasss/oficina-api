import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';

interface Cookies {
  accessToken?: string;
  refreshToken?: string;
}
@Controller('sessions')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;

    const { accessToken, refreshToken, user } = await this.authService.login(
      email,
      password,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    return { user };
  }

  @Get('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Cookies;
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Token de atualização ausente');
    }

    const payload = await this.authService['jwtService'].verifyAsync<{
      sub: string;
      isAdmin: boolean;
    }>(refreshToken);

    const { accessToken } = await this.authService.refresh(
      payload.sub,
      payload.isAdmin,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1h
    });

    return { message: 'Novo access token gerado!' };
  }
  // @Get('refresh')
  // refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  //   // Simula erro 401 por refresh sempre falhar
  //   throw new UnauthorizedException('Forçando falha de refresh para teste');
  // }
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logout realizado com sucesso' };
  }
}
