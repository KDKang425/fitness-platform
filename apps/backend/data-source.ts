import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';

// Load .env.local for local development if it exists, otherwise .env
import * as fs from 'fs';

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'fitness_db',

  entities: [
    join(__dirname, '/src/**/*.entity.{ts,js}'),
    join(__dirname, '/dist/**/*.entity.{ts,js}'),
  ],
  migrations: [join(__dirname, '/src/migrations/*.{ts,js}')],
  synchronize: false,
  migrationsRun: false,
  logging: process.env.NODE_ENV !== 'production',
  namingStrategy: new SnakeNamingStrategy(),
  extra: {
    max: 30, // Increased from default for better concurrency
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 30000,
  },
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
