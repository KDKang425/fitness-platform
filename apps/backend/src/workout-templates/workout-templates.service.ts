import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutTemplate } from './entities/workout-template.entity';

@Injectable()
export class WorkoutTemplatesService {
  constructor(
    @InjectRepository(WorkoutTemplate)
    private readonly templateRepo: Repository<WorkoutTemplate>,
  ) {}

  async create(userId: number, dto: any) {
    const template = this.templateRepo.create({
      user: { id: userId } as any,
      name: dto.name,
      exercises: dto.exercises,
      isQuickStart: dto.isQuickStart || false,
    });

    return this.templateRepo.save(template);
  }

  async findMyTemplates(userId: number) {
    return this.templateRepo.find({
      where: { user: { id: userId } },
      order: { 
        isQuickStart: 'DESC',
        usageCount: 'DESC',
        createdAt: 'DESC' 
      },
    });
  }

  async findOne(id: number, userId: number) {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!template) throw new NotFoundException('Template not found');
    if (template.user.id !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return template;
  }

  async update(id: number, userId: number, dto: any) {
    const template = await this.findOne(id, userId);
    
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async delete(id: number, userId: number) {
    const template = await this.findOne(id, userId);
    
    await this.templateRepo.remove(template);
    return { success: true, message: 'Template deleted successfully' };
  }

  async incrementUsage(id: number) {
    await this.templateRepo.increment({ id }, 'usageCount', 1);
  }

  async getQuickStartTemplates(userId: number) {
    return this.templateRepo.find({
      where: { 
        user: { id: userId },
        isQuickStart: true,
      },
      order: { usageCount: 'DESC' },
      take: 5,
    });
  }
}