import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
  }

  async uploadImage(file: Express.Multer.File) {
    this.validateFilename(file.filename);
    
    const fileUrl = `${this.baseUrl}/uploads/${file.filename}`;
    
    return {
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl,
    };
  }

  async uploadImages(files: Express.Multer.File[]) {
    return Promise.all(files.map(file => this.uploadImage(file)));
  }

  async deleteImage(filename: string) {
    this.validateFilename(filename);
    
    const fs = require('fs').promises;
    const normalizedFilename = path.basename(filename);
    const filePath = path.join(this.uploadDir, normalizedFilename);
    
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(this.uploadDir);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new BadRequestException('잘못된 파일 경로입니다.');
    }
    
    try {
      await fs.unlink(resolvedPath);
      return { success: true, message: '파일이 삭제되었습니다.' };
    } catch (error) {
      return { success: false, message: '파일 삭제에 실패했습니다.' };
    }
  }

  private validateFilename(filename: string) {
    const invalidChars = /[^a-zA-Z0-9._-]/;
    if (invalidChars.test(filename)) {
      throw new BadRequestException('잘못된 파일명입니다.');
    }
    
    if (filename.includes('..')) {
      throw new BadRequestException('잘못된 파일 경로입니다.');
    }
  }
}