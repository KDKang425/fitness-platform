// apps/backend/seeds/seed-test-users.ts

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';

// 환경변수 로드
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

// DataSource 설정
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'fitness_db',
  entities: [User],
  synchronize: true, // 개발용만
});

async function seedTestUsers() {
  try {
    await AppDataSource.initialize();
    console.log('데이터베이스 연결 성공');

    const userRepository = AppDataSource.getRepository(User);
    
    // 기존 테스트 계정들 확인
    const existingTestUser = await userRepository.findOne({
      where: { email: 'test@example.com' }
    });

    if (existingTestUser) {
      console.log('⚠️  테스트 계정이 이미 존재합니다.');
      return;
    }

    // 테스트 계정들 생성
    const testUsers = [
      {
        email: 'test@example.com',
        password: await bcrypt.hash('123456', 10),
        nickname: '테스트유저',
        emailVerified: true, // 🔧 이메일 인증 건너뛰기
        hasCompletedInitialSetup: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'demo@example.com', 
        password: await bcrypt.hash('123456', 10),
        nickname: '데모유저',
        emailVerified: true,
        hasCompletedInitialSetup: true, // 초기 설정 완료된 계정
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        nickname: '관리자',
        emailVerified: true,
        hasCompletedInitialSetup: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // 사용자 생성
    for (const userData of testUsers) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`✅ 테스트 계정 생성됨: ${userData.email} (비밀번호: ${userData.email === 'admin@example.com' ? 'admin123' : '123456'})`);
    }

    console.log('\n🎉 모든 테스트 계정이 성공적으로 생성되었습니다!');
    console.log('\n📋 테스트 계정 목록:');
    console.log('1. test@example.com / 123456 (기본 테스트 계정)');
    console.log('2. demo@example.com / 123456 (프로필 설정 완료 계정)');
    console.log('3. admin@example.com / admin123 (관리자 계정)');

  } catch (error) {
    console.error('❌ 시드 실행 중 에러:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('데이터베이스 연결 종료');
  }
}

// 스크립트 실행
seedTestUsers().catch(console.error);