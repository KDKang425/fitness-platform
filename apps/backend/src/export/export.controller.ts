import {
  Controller,
  Get,
  UseGuards,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExportService } from './export.service';
import { AuthRequest } from '../common/interfaces/auth-request.interface';

@ApiTags('export')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @ApiOperation({ summary: '내 데이터 전체 내보내기 (Excel)' })
  @Get('my-data')
  async exportMyData(@Req() req: AuthRequest) {
    const buffer = await this.exportService.exportUserData(req.user.userId);
    const fileName = `fitness-data-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${fileName}"`,
    });
  }
}