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

  private readonly errorMessages = {
    '23505': (err: any) => {
      if (err.constraint === 'users_email_key') return '이미 사용중인 이메일입니다.';
      if (err.constraint === 'users_nickname_key') return '이미 사용중인 닉네임입니다.';
      if (err.constraint === 'routine_exercises_routine_id_exercise_id_key') return '루틴에 중복된 운동이 있습니다.';
      if (err.constraint === 'likes_user_id_post_id_key') return '이미 좋아요한 게시물입니다.';
      if (err.constraint === 'follows_follower_id_following_id_key') return '이미 팔로우한 사용자입니다.';
      return '중복된 데이터가 존재합니다.';
    },
    '23503': () => '참조하는 데이터가 존재하지 않습니다.',
    '23502': () => '필수 항목이 누락되었습니다.',
    '22P02': () => '잘못된 데이터 형식입니다.',
  };

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
      
      const errorHandler = this.errorMessages[err.code];
      if (errorHandler) {
        message = typeof errorHandler === 'function' ? errorHandler(err) : errorHandler;
        status = err.code === '23505' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
        error = err.code === '23505' ? 'Conflict' : 'Bad Request';
      } else {
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

    if (process.env.NODE_ENV === 'production' && details?.stack) {
      delete details.stack;
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