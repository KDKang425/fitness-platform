#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Running fitness platform tests...\n');

// Test configurations
const tests = [
  {
    name: 'Backend TypeScript Check',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    cwd: __dirname,
    timeout: 30000,
  },
  {
    name: 'Backend Unit Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=posts.service.spec.ts', '--runInBand'],
    cwd: __dirname,
    timeout: 60000,
  },
];

async function runTest(test) {
  console.log(`\n🧪 Running: ${test.name}`);
  console.log('─'.repeat(50));
  
  return new Promise((resolve) => {
    const child = spawn(test.command, test.args, {
      cwd: test.cwd,
      stdio: 'pipe',
      shell: true,
    });
    
    let output = '';
    let errorOutput = '';
    
    const timeout = setTimeout(() => {
      child.kill();
      console.log(`❌ Test timed out after ${test.timeout / 1000}s`);
      resolve({ success: false, output, error: 'Timeout' });
    }, test.timeout);
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      const success = code === 0;
      console.log(success ? '✅ Test passed' : '❌ Test failed');
      resolve({ success, output, error: errorOutput });
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push({ name: test.name, ...result });
  }
  
  console.log('\n\n📊 Test Summary');
  console.log('═'.repeat(50));
  
  results.forEach((result) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n❌ Some tests failed. Please check the output above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(console.error);