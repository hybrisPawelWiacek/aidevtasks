// Add this at the top of the server entry point to filter out specific warnings
// Set environment variables for warning suppression
process.env.NODE_NO_WARNINGS = '1';

// Maximum safe integer for setTimeout (max signed 32-bit int)
const MAX_SAFE_TIMEOUT = 2147483647; // (2^31 - 1) milliseconds, ~24.8 days

// Keep reference to original timing functions
const originalSetTimeout = global.setTimeout;

// Monkey-patch setTimeout to cap large values
// Using a different approach for TypeScript to preserve all the function properties
const safeSetTimeout: typeof setTimeout = function setTimeoutReplacement(
  callback: (...args: any[]) => void,
  ms?: number,
  ...args: any[]
): NodeJS.Timeout {
  // If delay is too large, cap it at MAX_SAFE_TIMEOUT
  if (ms && ms > MAX_SAFE_TIMEOUT) {
    ms = MAX_SAFE_TIMEOUT;
  }
  return originalSetTimeout(callback, ms, ...args);
};

// Copy over all properties from the original setTimeout
Object.defineProperties(
  safeSetTimeout,
  Object.getOwnPropertyDescriptors(originalSetTimeout)
);

// Replace global setTimeout
global.setTimeout = safeSetTimeout;

// Store the original process.emitWarning function
const originalEmitWarning = process.emitWarning;

// Replace with our own function that filters out TimeoutOverflowWarning
process.emitWarning = function (warning: any, options?: any) {
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
  return originalEmitWarning.apply(this, [warning, options]);
};

// Also suppress TimeoutOverflowWarning warnings from the console
const originalConsoleWarn = console.warn;
console.warn = function(...args: any[]) {
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
  return originalConsoleWarn.apply(this, args);
};

// Patch global timeout functions to enforce limits
const originalClearTimeout = clearTimeout;
const safeClearTimeout: typeof clearTimeout = function clearTimeoutReplacement(
  timeoutId?: NodeJS.Timeout | undefined
): void {
  return originalClearTimeout(timeoutId);
};

// Copy over all properties 
Object.defineProperties(
  safeClearTimeout,
  Object.getOwnPropertyDescriptors(originalClearTimeout)
);

global.clearTimeout = safeClearTimeout;

// Let Node.js know we're handling warnings
console.log('Warning suppression registered: TimeoutOverflowWarnings will be intercepted and timeouts capped at safe values.');