import 'reflect-metadata';
import { runSeeder } from 'typeorm-extension';
import AppDataSource from '../data-source';
import ExerciseSeeder from '../seeds/ExerciseSeeder';

(async () => {
  await AppDataSource.initialize();
  await runSeeder(AppDataSource, ExerciseSeeder);
  await AppDataSource.destroy();
})();