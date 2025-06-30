import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'https://example.com/profile.jpg', description: '프로필 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiProperty({ example: 175, description: '키 (cm)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  height?: number;

  @ApiProperty({ example: 70, description: '몸무게 (kg or lbs)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weight?: number;

  @ApiProperty({ example: 'kg', description: '단위 설정', required: false })
  @IsOptional()
  @IsIn(['kg', 'lbs'])
  unitPreference?: 'kg' | 'lbs';
}