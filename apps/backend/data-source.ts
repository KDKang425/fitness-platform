import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [
    join(__dirname, '/src/**/*.entity.{ts,js}'),
    join(__dirname, '/dist/**/*.entity.{ts,js}'),
  ],
  migrations: [join(__dirname, '/src/migrations/*.{ts,js}')],
  synchronize: false,
  migrationsRun: false,
  logging: process.env.NODE_ENV !== 'production',
  namingStrategy: new SnakeNamingStrategy(),
};

export const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
