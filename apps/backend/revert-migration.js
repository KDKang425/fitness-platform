// Windows-compatible migration revert runner
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { spawn } = require('child_process');
const path = require('path');

const args = [
  '-r', 'tsconfig-paths/register',
  'node_modules/typeorm/cli.js',
  'migration:revert',
  '-d', './data-source.ts'
];

const child = spawn('ts-node', args, {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

child.on('exit', (code) => {
  process.exit(code);
});