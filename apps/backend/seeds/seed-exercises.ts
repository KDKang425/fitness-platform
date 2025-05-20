import 'reflect-metadata';
import dataSource from '../data-source';            
import {
  Exercise,
  MuscleGroup,
  ExerciseModality,
} from '../src/exercises/entities/exercise.entity';

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Exercise);

  if (await repo.count()) {
    console.log('Exercises already seeded');
    return;
  }

  const seeds: Partial<Exercise>[] = [
    { name: 'Barbell Bench Press', category: MuscleGroup.CHEST, modality: ExerciseModality.BARBELL },
    { name: 'Pull-Up',             category: MuscleGroup.BACK,  modality: ExerciseModality.BODYWEIGHT },
    { name: 'Barbell Squat',       category: MuscleGroup.QUADRICEPS, modality: ExerciseModality.BARBELL },
    { name: 'Deadlift',            category: MuscleGroup.BACK,  modality: ExerciseModality.BARBELL },
    { name: 'Overhead Press',      category: MuscleGroup.SHOULDER, modality: ExerciseModality.BARBELL },
    { name: 'Barbell Row',         category: MuscleGroup.BACK,  modality: ExerciseModality.BARBELL },
    { name: 'Bicep Curl',          category: MuscleGroup.BICEPS, modality: ExerciseModality.DUMBBELL },
    { name: 'Triceps Push-down',   category: MuscleGroup.TRICEPS, modality: ExerciseModality.CABLE },
  ];

  await repo.insert(seeds);       
  console.log(`✅ Seeded ${seeds.length} exercises`);

  await dataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
