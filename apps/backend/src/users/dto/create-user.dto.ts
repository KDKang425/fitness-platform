import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: '사용자 이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @Expose()
  email: string;

  @ApiProperty({ 
    example: 'Password123!', 
    description: '비밀번호 (최소 8자, 대소문자, 숫자, 특수문자 포함)' 
  })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다.',
    }
  )
  @Expose()
  password: string;

  @ApiProperty({ example: 'FitUser123', description: '사용자 닉네임' })
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @Expose()
  nickname: string;
}
