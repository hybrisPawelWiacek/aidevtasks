#!/usr/bin/env node

// Set environment variable to suppress Node.js warnings
process.env.NODE_NO_WARNINGS = '1';

// Load external module with dynamic import
import('tsx').then(tsx => {
  // Execute the server with no warnings
  console.log('Starting server with warnings suppressed...');
  
  // Import and run the server file
  import('./server/index.ts').catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}).catch(err => {
  console.error('Failed to import tsx:', err);
  process.exit(1);
});