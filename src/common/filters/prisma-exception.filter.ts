import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Tratando erros do Prisma
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Erro de campo único duplicado
      if (exception.code === 'P2002') {
        const field = (exception.meta?.target as string[])[0] || 'campo';

        const customMessages: Record<string, string> = {
          email: 'Este e-mail já está em uso.',
          cpf: 'Este CPF já foi cadastrado.',
          cnpj: 'Este CNPJ já foi cadastrado.',
        };

        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          code: 'DUPLICATE_FIELD',
          message:
            customMessages[field] ||
            `Já existe um registro com o mesmo valor para: ${field}`,
          field,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }
    }

    // Erro genérico
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
