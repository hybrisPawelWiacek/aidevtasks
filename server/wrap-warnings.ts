// Add this at the top of the server entry point to filter out specific warnings

// Store the original process.emitWarning function
const originalEmitWarning = process.emitWarning;

// Replace with our own function that filters out TimeoutOverflowWarning
process.emitWarning = function (warning: any, options?: any) {
  // Check if this is a TimeoutOverflowWarning
  if (
    warning && 
    typeof warning === 'object' && 
    warning.toString && 
    warning.toString().includes('does not fit into a 32-bit signed integer')
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
    firstArg.includes('TimeoutOverflowWarning')
  ) {
    // Silently ignore this specific warning
    return;
  }
  
  // For all other warnings, pass through to the original function
  return originalConsoleWarn.apply(this, args);
};