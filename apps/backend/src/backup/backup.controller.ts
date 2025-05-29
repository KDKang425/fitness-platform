import { Controller, Get, Post, UseGuards, Req, Res, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { BackupService } from './backup.service';
import { ExportService } from '../export/export.service';

@ApiTags('backup')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('backup')
export class BackupController {
  constructor(
    private readonly exportService: ExportService,
    private readonly backupService: BackupService,
  ) {}

  @ApiOperation({ summary: '전체 데이터 백업 (JSON)' })
  @Get('download')
  async downloadBackup(@Req() req: AuthRequest, @Res() res: Response) {
    const data = await this.backupService.createFullBackup(req.user.userId);
    const filename = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  @ApiOperation({ summary: '백업 데이터 복원' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        exportDate: { type: 'string' },
        checksum: { type: 'string' },
        user: { type: 'object' },
        workoutSessions: { type: 'array' },
        bodyRecords: { type: 'array' },
        routines: { type: 'array' },
        personalRecords: { type: 'array' },
      },
    },
  })
  @Post('restore')
  async restoreBackup(@Req() req: AuthRequest, @Body() backupData: any) {
    return this.backupService.restoreFromBackup(req.user.userId, backupData);
  }

  @ApiOperation({ summary: '클라우드 동기화 상태' })
  @Get('sync-status')
  async getSyncStatus(@Req() req: AuthRequest) {
    return this.backupService.getSyncStatus(req.user.userId);
  }

  @ApiOperation({ summary: '수동 동기화 실행' })
  @Post('sync')
  async syncData(@Req() req: AuthRequest) {
    return this.backupService.syncToCloud(req.user.userId);
  }
}