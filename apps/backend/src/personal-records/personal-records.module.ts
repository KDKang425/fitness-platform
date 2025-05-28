import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PersonalRecord } from './entities/personal-record.entity';
import { PersonalRecordsService } from './personal-records.service';
import { PersonalRecordsController } from './personal-records.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PersonalRecord])],
  providers: [PersonalRecordsService],
  controllers: [PersonalRecordsController],
  exports: [PersonalRecordsService],
})
export class PersonalRecordsModule {}
