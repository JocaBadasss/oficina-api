// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  isAdmin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookies = request.cookies as { accessToken?: string };
          return cookies?.accessToken || null;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET || 'segredo_do_joca',
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      isAdmin: payload.isAdmin,
    };
  }
}
