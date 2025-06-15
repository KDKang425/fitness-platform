const { Client } = require('pg');

async function seedExercises() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Bioshock3$',
    database: 'fitness_db'
  });

  try {
    await client.connect();
    
    // Check if exercises exist
    const countResult = await client.query('SELECT COUNT(*) FROM exercises');
    if (parseInt(countResult.rows[0].count) > 0) {
      console.log('Exercises already seeded');
      return;
    }

    // Insert exercises
    const exercises = [
      ['Barbell Bench Press', 'CHEST', 'BARBELL'],
      ['Pull-Up', 'BACK', 'BODYWEIGHT'],
      ['Barbell Squat', 'QUADRICEPS', 'BARBELL'],
      ['Deadlift', 'BACK', 'BARBELL'],
      ['Overhead Press', 'SHOULDER', 'BARBELL'],
      ['Barbell Row', 'BACK', 'BARBELL'],
      ['Bicep Curl', 'BICEPS', 'DUMBBELL'],
      ['Triceps Push-down', 'TRICEPS', 'CABLE'],
      ['Lat Pulldown', 'BACK', 'CABLE'],
      ['Leg Press', 'QUADRICEPS', 'MACHINE'],
      ['Dumbbell Fly', 'CHEST', 'DUMBBELL'],
      ['Hammer Curl', 'BICEPS', 'DUMBBELL'],
      ['Leg Curl', 'HAMSTRING', 'MACHINE'],
      ['Calf Raise', 'CALVES', 'MACHINE'],
      ['Plank', 'ABS', 'BODYWEIGHT'],
      ['Dumbbell Lateral Raise', 'SHOULDER', 'DUMBBELL'],
      ['Face Pull', 'BACK', 'CABLE'],
      ['Romanian Deadlift', 'HAMSTRING', 'BARBELL'],
      ['Front Squat', 'QUADRICEPS', 'BARBELL'],
      ['Incline Bench Press', 'CHEST', 'BARBELL']
    ];

    for (const [name, category, modality] of exercises) {
      await client.query(
        'INSERT INTO exercises (name, category, modality, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [name, category, modality]
      );
    }

    console.log(`✅ Seeded ${exercises.length} exercises`);
  } catch (error) {
    console.error('Error seeding exercises:', error);
  } finally {
    await client.end();
  }
}

seedExercises();