import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';

function isExceptionWithMessage(
  val: unknown,
): val is { message: string; code?: string; stack?: string } {
  if (typeof val !== 'object' || val === null) return false;

  const maybeError = val as Record<string, unknown>;
  return typeof maybeError.message === 'string';
}

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 🔒 Trata erro de constraint do Prisma (ex: duplicado)
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

    // ✅ Trata exceções padrão do Nest
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

    // 🔥 Fallback: erro inesperado (ex: erro do Prisma não tratado)
    if (isExceptionWithMessage(exception)) {
      console.error('Erro interno não tratado:', {
        method: request.method,
        url: request.url,
        message: exception.message,
        code: exception.code,
        stack: exception.stack,
      });
    } else {
      console.error('Erro interno desconhecido:', exception);
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
