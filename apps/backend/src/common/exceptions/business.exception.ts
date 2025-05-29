import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode = HttpStatus.BAD_REQUEST) {
    super({ message, error: 'Business Error' }, statusCode);
  }
}

export class DuplicateException extends HttpException {
  constructor(message: string) {
    super({ message, error: 'Duplicate Error' }, HttpStatus.CONFLICT);
  }
}

export class ValidationException extends HttpException {
  constructor(message: string) {
    super({ message, error: 'Validation Error' }, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}