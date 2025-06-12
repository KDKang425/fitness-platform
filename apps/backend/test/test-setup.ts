import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../src/config/test-database.config';

export async function createTestingModule(metadata: any): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    ...metadata,
    imports: [
      TypeOrmModule.forRoot(testDatabaseConfig),
      ...(metadata.imports || []),
    ],
  }).compile();

  return moduleRef;
}

// Mock configuration module
export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '1h',
      'database': testDatabaseConfig,
    };
    return config[key];
  }),
};

// Common test utilities
export const clearDatabase = async (connection: any) => {
  const entities = connection.entityMetadatas;
  for (const entity of entities) {
    const repository = connection.getRepository(entity.name);
    await repository.clear();
  }
};