// Windows-compatible migration generator
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { spawn } = require('child_process');
const path = require('path');

// Get migration name from command line arguments
const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Please provide a migration name');
  console.error('Usage: npm run migration:generate -- MigrationName');
  process.exit(1);
}

const args = [
  '-r', 'tsconfig-paths/register',
  'node_modules/typeorm/cli.js',
  'migration:generate',
  '-d', './data-source.ts',
  `src/migrations/${migrationName}`
];

const child = spawn('ts-node', args, {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

child.on('exit', (code) => {
  process.exit(code);
});