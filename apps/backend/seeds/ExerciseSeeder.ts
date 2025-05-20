import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Exercise, MuscleGroup, ExerciseModality } from '../exercises/entities/exercise.entity';
import { faker } from '@faker-js/faker';

export default class ExerciseSeeder implements Seeder {
  async run(ds: DataSource): Promise<void> {
    const repo = ds.getRepository(Exercise);
    if (await repo.count()) return; 

    const seeds: Partial<Exercise>[] = [
      { name: 'Barbell Bench Press', category: MuscleGroup.CHEST, modality: ExerciseModality.BARBELL },
      { name: 'Pull-Up',     category: MuscleGroup.BACK,  modality: ExerciseModality.BODYWEIGHT },
      { name: 'Barbell Squat',     category: MuscleGroup.QUADRICEPS /* dummy */, modality: ExerciseModality.CARDIO },
    ];

    for (let i = 0; i < 17; i++) {
      seeds.push({
        name: faker.word.verb() + ' ' + faker.word.noun(),
        category: faker.helpers.arrayElement(Object.values(MuscleGroup)),
        modality: faker.helpers.arrayElement(Object.values(ExerciseModality)),
      });
    }
    await repo.insert(seeds);
    console.log(`✅ Seeded ${seeds.length} exercises`);
  }
}
