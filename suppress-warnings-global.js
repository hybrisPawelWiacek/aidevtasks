// This is a global warning suppression script that will be required
// at the very beginning of the application startup

// For Node.js warning suppression
process.env.NODE_NO_WARNINGS = '1';

// Monkey-patch console.warn to filter out TimeoutOverflowWarning
const originalWarn = console.warn;
console.warn = function(...args) {
  // Check if this is a TimeoutOverflowWarning
  const firstArg = args[0] || '';
  if (
    typeof firstArg === 'string' && 
    (firstArg.includes('TimeoutOverflowWarning') || 
     firstArg.includes('does not fit into a 32-bit signed integer'))
  ) {
    // Silently ignore this specific warning
    return;
  }
  
  // For all other warnings, pass through to the original function
  return originalWarn.apply(this, args);
};

// Monkey-patch setTimeout to prevent values larger than MAX_SAFE_TIMEOUT
const originalSetTimeout = setTimeout;
const MAX_SAFE_TIMEOUT = 2147483647; // (2^31 - 1) milliseconds

global.setTimeout = function(callback, delay, ...args) {
  // If delay is too large, cap it at MAX_SAFE_TIMEOUT
  if (delay > MAX_SAFE_TIMEOUT) {
    delay = MAX_SAFE_TIMEOUT;
  }
  return originalSetTimeout(callback, delay, ...args);
};

// Create a utility to register our global patcher 
module.exports = {
  register: function() {
    console.log('Warning suppression registered. TimeoutOverflowWarnings will not be displayed.');
  }
};

// Self-register when imported
module.exports.register();