import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // ← AQUI
import { Request, Response } from 'express';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 🔒 Erro padrão do Prisma
    if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const field = (exception.meta?.target as string[])[0] || 'campo';

        const customMessages: Record<string, string> = {
          email: 'Este e-mail já está em uso.',
          cpf: 'Este CPF já foi cadastrado.',
          cnpj: 'Este CNPJ já foi cadastrado.',
          plate: 'Esta placa já está cadastrada.',
        };

        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          code: 'DUPLICATE_FIELD',
          message: customMessages[field] || `Valor duplicado para: ${field}`,
          field,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }
    }

    // ✅ Agora trata HttpException normal (ex: NotFoundException)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();

      return response.status(status).json({
        statusCode: status,
        code: 'HTTP_EXCEPTION',
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // 🔥 Fallback final: erro desconhecido (500)
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
