// Suppress Node.js warnings
process.env.NODE_NO_WARNINGS = 1;

// Use child_process to start the server with warnings suppressed
const { spawn } = require('child_process');
const path = require('path');

// Launch the server with warnings suppressed
const server = spawn('node', ['--no-warnings', path.join(__dirname, 'index.ts')], {
  stdio: 'inherit',
  env: { ...process.env, NODE_NO_WARNINGS: '1' }
});

// Handle server process exit
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Forward signals to child process
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    if (!server.killed) {
      server.kill(signal);
    }
  });
});