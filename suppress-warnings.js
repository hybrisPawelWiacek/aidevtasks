// Global utility to suppress timeout overflow warnings and other Node.js warnings
// This file can be required at the entry point of any application

// Set environment variables for warning suppression
process.env.NODE_NO_WARNINGS = '1';

// Maximum safe integer for setTimeout (max signed 32-bit int)
const MAX_SAFE_TIMEOUT = 2147483647; // (2^31 - 1) milliseconds, ~24.8 days

// Monkey-patch setTimeout to cap large values
const originalSetTimeout = setTimeout;
global.setTimeout = function(callback, delay, ...args) {
  // If delay is too large, cap it at MAX_SAFE_TIMEOUT
  if (delay > MAX_SAFE_TIMEOUT) {
    delay = MAX_SAFE_TIMEOUT;
  }
  return originalSetTimeout(callback, delay, ...args);
};

// Monkey-patch setInterval to cap large values
const originalSetInterval = setInterval;
global.setInterval = function(callback, delay, ...args) {
  // If delay is too large, cap it at MAX_SAFE_TIMEOUT
  if (delay > MAX_SAFE_TIMEOUT) {
    delay = MAX_SAFE_TIMEOUT;
  }
  return originalSetInterval(callback, delay, ...args);
};

// Store the original process.emitWarning function
const originalEmitWarning = process.emitWarning;

// Replace with our own function that filters out TimeoutOverflowWarning
process.emitWarning = function(warning, options) {
  // Check if this is a TimeoutOverflowWarning
  if (
    (warning && 
     typeof warning === 'object' && 
     warning.toString && 
     warning.toString().includes('does not fit into a 32-bit signed integer')) ||
    (typeof warning === 'string' &&
     warning.includes('does not fit into a 32-bit signed integer'))
  ) {
    // Silently ignore this specific warning
    return;
  }
  
  // For all other warnings, pass through to the original function
  return originalEmitWarning.apply(this, arguments);
};

// Also suppress TimeoutOverflowWarning warnings from the console
const originalConsoleWarn = console.warn;
console.warn = function() {
  // Check if this is a TimeoutOverflowWarning
  const firstArg = arguments[0] || '';
  if (
    typeof firstArg === 'string' && 
    (firstArg.includes('TimeoutOverflowWarning') || 
     firstArg.includes('does not fit into a 32-bit signed integer'))
  ) {
    // Silently ignore this specific warning
    return;
  }
  
  // For all other warnings, pass through to the original function
  return originalConsoleWarn.apply(this, arguments);
};

// For more comprehensive warning suppression
// Monkey patch unref() to ignore errors on timeout clear operations
const originalTimerUnref = Object.getPrototypeOf(setTimeout(() => {}, 0)).unref;
if (originalTimerUnref) {
  Object.getPrototypeOf(setTimeout(() => {}, 0)).unref = function() {
    try {
      return originalTimerUnref.apply(this);
    } catch (e) {
      // Silently ignore errors in unref
      return this;
    }
  };
}

console.log('Global warning suppression registered: TimeoutOverflowWarnings will be intercepted and timeouts capped at safe values.');

module.exports = {
  MAX_SAFE_TIMEOUT
};