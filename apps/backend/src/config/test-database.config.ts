import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

export const testDatabaseConfig: TypeOrmModuleOptions & DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: false,
  dropSchema: true,
};

export const testDataSourceOptions: DataSourceOptions = {
  ...testDatabaseConfig,
  entities: ['src/**/*.entity.ts'],
};