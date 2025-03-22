#!/usr/bin/env node

// This script analyzes the codebase for setTimeout calls that might be causing TimeoutOverflowWarning

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Capture original setTimeout to avoid our own detection
const originalSetTimeout = setTimeout;
const MAX_SAFE_TIMEOUT = 2147483647; // (2^31 - 1) milliseconds, ~24.8 days

// Log all setTimeout calls with large values
const monitorSetTimeout = function(callback, delay, ...args) {
  if (delay > MAX_SAFE_TIMEOUT) {
    console.warn(`WARNING: Large setTimeout value detected: ${delay}ms`);
    // Get stack trace
    const stack = new Error().stack.split('\n').slice(2).join('\n');
    console.warn(`Stack trace:\n${stack}\n`);
    
    // Use a safe value instead
    delay = MAX_SAFE_TIMEOUT;
  }
  return originalSetTimeout(callback, delay, ...args);
};

// Find all .js and .ts files in the project
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findJsFiles(filePath, fileList);
    } else if (/\.(js|ts|tsx|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Scan a file for setTimeout calls with large values
function scanFileForTimeouts(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Regular expressions to find setTimeout calls
  const timeoutPatterns = [
    /setTimeout\s*\(\s*(?:[^,]+)\s*,\s*(\d+)/g,               // setTimeout(fn, delay)
    /setTimeout\s*\(\s*(?:[^,]+)\s*,\s*([^,)]+)/g,            // setTimeout(fn, someVar)
    /(?:const|let|var)\s+(\w+)\s*=\s*(\d+)\s*(?:;|\n)/g       // const DELAY = 10000;
  ];
  
  let results = [];
  
  // Check first pattern - direct timeout values
  let match;
  while ((match = timeoutPatterns[0].exec(content)) !== null) {
    const delay = parseInt(match[1], 10);
    if (delay > MAX_SAFE_TIMEOUT || delay < 0) {
      results.push({
        file: filePath,
        line: getLineNumber(content, match.index),
        delay: delay,
        code: content.substring(match.index, match.index + match[0].length + 20).trim()
      });
    }
  }
  
  return results;
}

// Get line number from content and position
function getLineNumber(content, index) {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

// Main function
function main() {
  console.log('Analyzing codebase for potential timeout overflow issues...');
  
  const jsFiles = findJsFiles('.');
  let allTimeoutIssues = [];
  
  jsFiles.forEach(file => {
    const issues = scanFileForTimeouts(file);
    if (issues.length > 0) {
      allTimeoutIssues = allTimeoutIssues.concat(issues);
    }
  });
  
  if (allTimeoutIssues.length > 0) {
    console.log(`Found ${allTimeoutIssues.length} potential timeout overflow issues:`);
    allTimeoutIssues.forEach(issue => {
      console.log(`\nFile: ${issue.file} (Line ${issue.line})`);
      console.log(`Delay: ${issue.delay}`);
      console.log(`Code: ${issue.code}`);
    });
  } else {
    console.log('No timeout overflow issues found in static analysis.');
    console.log('The issues might be coming from third-party libraries or dynamically calculated timeouts.');
  }
}

main();