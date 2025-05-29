import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyRecordsController } from './body-records.controller';
import { BodyRecordsService } from './body-records.service';
import { BodyRecord } from './entities/body-record.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([BodyRecord]), AuthModule],
  controllers: [BodyRecordsController],
  providers: [BodyRecordsService],
})
export class BodyRecordsModule {}
