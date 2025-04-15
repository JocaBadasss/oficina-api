import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('sessions')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }
}
