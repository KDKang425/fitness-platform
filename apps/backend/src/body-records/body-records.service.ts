import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BodyRecord } from './entities/body-record.entity';
import { CreateBodyRecordDto } from './dto/create-body-record.dto';

@Injectable()
export class BodyRecordsService {
  constructor(
    @InjectRepository(BodyRecord)
    private readonly brRepo: Repository<BodyRecord>,
  ) {}

  async create(userId: number, dto: CreateBodyRecordDto) {
    const record = this.brRepo.create({ ...dto, user: { id: userId } as any });
    return this.brRepo.save(record);
  }

  async delete(userId: number, id: number) {
    const rec = await this.brRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!rec) throw new NotFoundException();
    if (rec.user.id !== userId) throw new ForbiddenException();
    await this.brRepo.remove(rec);
    return { success: true };
  }

    async trend(userId: number, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromStr = from.toISOString().slice(0, 10); // YYYY-MM-DD

    const list = await this.brRepo.find({
      where: {
        user: { id: userId },
        date: Between(fromStr, new Date().toISOString().slice(0, 10)),
      },
      order: { date: 'ASC' },
    });

    return list.map((r) => ({
      date: r.date,
      weight: r.weight,
      bodyFat: r.bodyFatPercentage,
      muscle: r.skeletalMuscleMass,
    }));
  }

}
