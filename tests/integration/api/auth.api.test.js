import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import express from 'express';
import { registerRoutes } from '../../../server/routes';
import * as db from '../../../server/db';

// Mock dependencies
jest.mock('../../../server/db', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(true),
  initializeUserSessionsTable: jest.fn().mockResolvedValue(true),
  initializeSessionTable: jest.fn().mockResolvedValue(true),
  db: {
    insert: jest.fn().mockResolvedValue({}),
    select: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../../../server/pg-storage', () => {
  return {
    PostgresStorage: jest.fn().mockImplementation(() => ({
      getUserByEmail: jest.fn().mockImplementation((email) => {
        // Return a user for login test
        if (email === 'test@example.com') {
          return Promise.resolve({
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Test User',
            password: '$2b$10$S7vYqYJjKHDB5rVDWCjPjOoULLJqnoisV4Db1aTxbwIBY3munSrH.', // bcrypt hash for 'password123'
          });
        }
        // Return null for non-existing user
        return Promise.resolve(null);
      }),
      createUser: jest.fn().mockImplementation((userData) => {
        return Promise.resolve({
          id: 2,
          ...userData,
          password: null // Don't return password in response
        });
      }),
    }))
  };
});

jest.mock('express-session', () => {
  const session = () => (req, res, next) => {
    req.session = {
      passport: { user: null },
      destroy: (cb) => cb && cb(),
    };
    next();
  };
  session.Store = class Store {};
  return session;
});

jest.mock('passport', () => ({
  initialize: () => (req, res, next) => next(),
  session: () => (req, res, next) => next(),
  authenticate: () => (req, res, next) => {
    if (req.body.email === 'test@example.com' && req.body.password === 'password123') {
      req.user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      };
      req.session.passport = { user: 1 };
      return next();
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  },
  use: jest.fn(),
  serializeUser: (fn) => fn({}, (_, user) => user),
  deserializeUser: (fn) => fn({}, (_, id) => id),
}));

describe('Auth API Integration Tests', () => {
  let app;
  let request;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Initialize routes
    await registerRoutes(app);
    
    request = supertest(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        displayName: 'New User',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request
        .post('/api/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body.user).toHaveProperty('username', newUser.username);
      expect(response.body.user).toHaveProperty('displayName', newUser.displayName);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 if passwords do not match', async () => {
      const newUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        displayName: 'New User',
        password: 'password123',
        confirmPassword: 'differentpassword'
      };

      const response = await request
        .post('/api/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0].path).toContain('confirmPassword');
    });

    it('should return 400 if required fields are missing', async () => {
      const newUser = {
        email: 'newuser@example.com',
        // Missing username, displayName, password
      };

      const response = await request
        .post('/api/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', 1);
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await request
        .post('/api/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/)
        .expect(401);
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return user status when authenticated', async () => {
      // First login to set session
      await request
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Mock express-session to simulate authenticated user
      app.use((req, res, next) => {
        req.isAuthenticated = () => true;
        req.user = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User'
        };
        next();
      });

      const response = await request
        .get('/api/auth/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', 1);
    });

    it('should return null when not authenticated', async () => {
      // Override the previous mock to simulate unauthenticated user
      app.use((req, res, next) => {
        req.isAuthenticated = () => false;
        req.user = null;
        next();
      });

      const response = await request
        .get('/api/auth/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ user: null });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should log out the user', async () => {
      // Mock session destroy
      let sessionDestroyed = false;
      app.use((req, res, next) => {
        req.session = {
          destroy: (cb) => {
            sessionDestroyed = true;
            cb && cb();
          }
        };
        next();
      });

      const response = await request
        .post('/api/auth/logout')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(sessionDestroyed).toBe(true);
    });
  });
});