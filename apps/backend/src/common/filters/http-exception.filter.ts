import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
        details = (exceptionResponse as any).details;
      }
    }
    else if (exception instanceof QueryFailedError) {
      const err = exception as any;
      
      switch (err.code) {
        case '23505': 
          status = HttpStatus.CONFLICT;
          error = 'Conflict';
          message = '중복된 데이터가 존재합니다.';
          if (err.detail) {
            const match = err.detail.match(/Key \((.+)\)=\((.+)\) already exists/);
            if (match) {
              message = `${match[1]}이(가) 이미 존재합니다: ${match[2]}`;
            }
          }
          break;
          
        case '23503':
          status = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = '참조하는 데이터가 존재하지 않습니다.';
          break;
          
        case '23502': 
          status = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = '필수 항목이 누락되었습니다.';
          break;
          
        case '22P02': 
          status = HttpStatus.BAD_REQUEST;
          error = 'Bad Request';
          message = '잘못된 데이터 형식입니다.';
          break;
          
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          error = 'Database Error';
          message = '데이터베이스 오류가 발생했습니다.';
      }
      
      if (process.env.NODE_ENV === 'development') {
        details = {
          code: err.code,
          detail: err.detail,
          table: err.table,
          constraint: err.constraint,
        };
      }
    }
    else if (exception instanceof Error) {
      message = exception.message;
      
      if (process.env.NODE_ENV === 'development') {
        details = {
          stack: exception.stack,
        };
      }
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
      ...(details && { details }),
    });
  }
}