// Windows-compatible seed runner
const { spawn } = require('child_process');
const path = require('path');

console.log('Running seed scripts...\n');

// Run seed-exercises.ts first
const exercisesArgs = [
  '-r', 'tsconfig-paths/register',
  '-r', 'dotenv/config',
  'seeds/seed-exercises.ts'
];

console.log('Seeding exercises...');
const exercisesChild = spawn('ts-node', exercisesArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

exercisesChild.on('exit', (code) => {
  if (code !== 0) {
    console.error('Exercise seeding failed');
    process.exit(code);
  }
  
  console.log('\nSeeding demo data...');
  // Run seed-demo-data.ts after exercises succeed
  const demoDataArgs = [
    '-r', 'tsconfig-paths/register',
    '-r', 'dotenv/config',
    'seeds/seed-demo-data.ts'
  ];
  
  const demoDataChild = spawn('ts-node', demoDataArgs, {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  demoDataChild.on('exit', (code) => {
    if (code === 0) {
      console.log('\nAll seeds completed successfully!');
    }
    process.exit(code);
  });
});