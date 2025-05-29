import { IsString, IsInt, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  @Expose({ name: 'parent_id' })
  parentId: number;
}