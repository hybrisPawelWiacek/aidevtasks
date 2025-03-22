// This script suppresses specific Node.js warnings
// Store the original process.emitWarning function
const originalEmitWarning = process.emitWarning;

// Replace with our own function that filters out TimeoutOverflowWarning
process.emitWarning = function (warning, options) {
  // Check if this is a TimeoutOverflowWarning
  if (warning && warning.toString().includes('does not fit into a 32-bit signed integer')) {
    // Silently ignore this specific warning
    return;
  }
  
  // For all other warnings, pass through to the original function
  return originalEmitWarning.apply(this, arguments);
};

console.log('TimeoutOverflowWarning messages have been suppressed');