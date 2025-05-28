import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PersonalRecordsService } from './personal-records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { id: number } }

@ApiTags('personal-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('personal-records')
export class PersonalRecordsController {
  constructor(private readonly svc: PersonalRecordsService) {}

  @Get()
  listMine(@Req() req: AuthReq) {
    return this.svc.listMine(req.user.id);
  }
}
