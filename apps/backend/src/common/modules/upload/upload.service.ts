import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  async uploadImage(file: Express.Multer.File) {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;
    
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
    const fs = require('fs').promises;
    const path = require('path');
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const filePath = path.join(uploadDir, filename);
    
    try {
      await fs.unlink(filePath);
      return { success: true, message: '파일이 삭제되었습니다.' };
    } catch (error) {
      return { success: false, message: '파일 삭제에 실패했습니다.' };
    }
  }
}