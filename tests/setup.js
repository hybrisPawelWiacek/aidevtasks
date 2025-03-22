// Set up Jest environment

// Mock Vite's import.meta.env
global.import = {
  meta: {
    env: {
      PROD: false,
      DEV: true,
      MODE: 'test',
      VITE_ENVIRONMENT: 'test'
    }
  }
};

// Mock window object for browser APIs
global.window = {
  location: {
    hostname: 'localhost',
    protocol: 'http:',
    host: 'localhost:3000',
    pathname: '/'
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
};

// Mock document object
global.document = {
  querySelector: jest.fn(),
  createElement: jest.fn(),
  readyState: 'complete'
};

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200
  })
);

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn()
};