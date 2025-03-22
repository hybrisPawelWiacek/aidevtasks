/** @type {import('jest').Config} */
const config = {
  // Use jsdom environment for frontend components
  testEnvironment: 'jsdom',
  
  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Transform files with babel
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Ignore node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(@?react.*|wouter|@?tanstack.*|zod.*|@hookform.*|class-variance-authority|tailwind-merge|clsx)/)'
  ],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // Test coverage
  collectCoverageFrom: [
    'client/src/**/*.{js,jsx,ts,tsx}',
    'server/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/tests/**'
  ],
  
  // Root directory
  rootDir: './',
  
  // Testregex for test discovery
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  
  // Support ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts', '.jsx'],
  
  // Extra config for ESM support
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};

module.exports = config;