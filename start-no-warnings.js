// Load the warning suppression code first
require('./suppress-warnings.js');

// Then spawn the server process
const { spawnSync } = require('child_process');

// Run the server using tsx
console.log('Starting server with warnings suppressed...');
const result = spawnSync('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true
});

// Handle exit code
process.exit(result.status);