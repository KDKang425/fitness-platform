import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException,
  BadRequestException 
} from '@nestjs/common';
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
      description: dto.description,
      exercises: dto.exercises,
      isQuickStart: dto.isQuickStart || false,
      isPublic: dto.isPublic || false,
      tags: dto.tags,
      difficulty: dto.difficulty,
      estimatedDuration: dto.estimatedDuration,
      targetMuscles: dto.targetMuscles,
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

  async findPublicTemplates(
    page = 1, 
    limit = 20, 
    filters?: {
      difficulty?: string;
      tags?: string[];
      search?: string;
      sort?: 'popular' | 'recent' | 'mostUsed';
    }
  ) {
    const query = this.templateRepo.createQueryBuilder('template')
      .leftJoinAndSelect('template.user', 'user')
      .where('template.isPublic = true')
      .select([
        'template.id',
        'template.name',
        'template.description',
        'template.exercises',
        'template.difficulty',
        'template.tags',
        'template.subscriberCount',
        'template.usageCount',
        'template.cloneCount',
        'template.estimatedDuration',
        'template.targetMuscles',
        'template.createdAt',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ]);

    if (filters?.difficulty) {
      query.andWhere('template.difficulty = :difficulty', { 
        difficulty: filters.difficulty 
      });
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.andWhere('template.tags && :tags', { tags: filters.tags });
    }

    if (filters?.search) {
      query.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    switch (filters?.sort) {
      case 'popular':
        query.orderBy('template.subscriberCount', 'DESC');
        break;
      case 'mostUsed':
        query.orderBy('template.usageCount', 'DESC');
        break;
      case 'recent':
      default:
        query.orderBy('template.createdAt', 'DESC');
    }

    const skip = (page - 1) * limit;
    const [templates, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId?: number) {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!template) throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    
    if (!template.isPublic && template.user.id !== userId) {
      throw new ForbiddenException('이 템플릿에 접근할 권한이 없습니다.');
    }

    return template;
  }

  async update(id: number, userId: number, dto: any) {
    const template = await this.findOne(id, userId);
    
    if (template.user.id !== userId) {
      throw new ForbiddenException('이 템플릿을 수정할 권한이 없습니다.');
    }
    
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async delete(id: number, userId: number) {
    const template = await this.findOne(id, userId);
    
    if (template.user.id !== userId) {
      throw new ForbiddenException('이 템플릿을 삭제할 권한이 없습니다.');
    }
    
    await this.templateRepo.remove(template);
    return { success: true, message: '템플릿이 삭제되었습니다.' };
  }

  async togglePublic(id: number, userId: number, isPublic: boolean) {
    const template = await this.findOne(id, userId);
    
    if (template.user.id !== userId) {
      throw new ForbiddenException('이 템플릿을 수정할 권한이 없습니다.');
    }
    
    template.isPublic = isPublic;
    if (!isPublic) {
      template.subscriberCount = 0;
    }
    
    return this.templateRepo.save(template);
  }

  async cloneTemplate(templateId: number, userId: number, customName?: string) {
    const original = await this.templateRepo.findOne({
      where: { id: templateId },
      relations: ['user'],
    });

    if (!original) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    if (!original.isPublic && original.user.id !== userId) {
      throw new ForbiddenException('이 템플릿을 복제할 권한이 없습니다.');
    }

    const clone = this.templateRepo.create({
      user: { id: userId } as any,
      name: customName || `${original.name} (복사본)`,
      description: original.description,
      exercises: original.exercises,
      isQuickStart: false,
      isPublic: false,
      tags: original.tags,
      difficulty: original.difficulty,
      estimatedDuration: original.estimatedDuration,
      targetMuscles: original.targetMuscles,
    });

    const saved = await this.templateRepo.save(clone);

    await this.templateRepo.increment({ id: templateId }, 'cloneCount', 1);

    return saved;
  }

  async subscribeToTemplate(templateId: number, userId: number) {
    const template = await this.findOne(templateId);
    
    if (!template.isPublic) {
      throw new BadRequestException('비공개 템플릿은 구독할 수 없습니다.');
    }

    await this.templateRepo.increment({ id: templateId }, 'subscriberCount', 1);
    
    return { success: true, message: '템플릿을 구독했습니다.' };
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

  async getPopularTemplates(limit = 10) {
    return this.templateRepo.find({
      where: { isPublic: true },
      order: { 
        subscriberCount: 'DESC',
        usageCount: 'DESC',
      },
      relations: ['user'],
      select: {
        id: true,
        name: true,
        description: true,
        subscriberCount: true,
        usageCount: true,
        difficulty: true,
        tags: true,
        user: {
          id: true,
          nickname: true,
          profileImageUrl: true,
        },
      },
      take: limit,
    });
  }

  async getTrendingTemplates(limit = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const templates = await this.templateRepo
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.user', 'user')
      .where('template.isPublic = true')
      .andWhere('template.updatedAt >= :date', { date: thirtyDaysAgo })
      .select([
        'template.id',
        'template.name',
        'template.description',
        'template.subscriberCount',
        'template.usageCount',
        'template.difficulty',
        'template.tags',
        'user.id',
        'user.nickname',
        'user.profileImageUrl',
      ])
      .orderBy('template.usageCount', 'DESC')
      .limit(limit)
      .getMany();

    return templates;
  }
}