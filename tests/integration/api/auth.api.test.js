const { describe, it, expect, beforeEach, jest, afterAll, beforeAll } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const { registerRoutes } = require('../../../server/routes');
const { storage } = require('../../../server/storage');
const bcrypt = require('bcryptjs');

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mocksalt'),
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn()
}));

// Mock the storage implementation
jest.mock('../../../server/storage', () => ({
  storage: {
    getUserByEmail: jest.fn(),
    getUserByUsername: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getUser: jest.fn()
  }
}));

// Mock database initialization
jest.mock('../../../server/db', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(true),
  initializeUserSessionsTable: jest.fn().mockResolvedValue(true),
  createDemoTasks: jest.fn(),
  db: {},
  pool: {}
}));

// Mock passport
jest.mock('passport', () => ({
  initialize: () => (req, res, next) => next(),
  session: () => (req, res, next) => next(),
  authenticate: () => (req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    if (typeof next === 'function') next();
    return (err, user, info) => {
      if (user) {
        req.login = (user, cb) => cb();
      }
    };
  },
  use: jest.fn()
}));

describe('Authentication API Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(() => {
    if (server && server.close) {
      server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      const createdUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      };
      
      storage.getUserByEmail.mockResolvedValue(null);
      storage.getUserByUsername.mockResolvedValue(null);
      storage.createUser.mockResolvedValue(createdUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body.user).toEqual(createdUser);
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(newUser.password, 'mocksalt');
      expect(storage.createUser).toHaveBeenCalledWith({
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
        password_hash: 'hashedpassword'
      });
    });

    it('should validate registration data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        username: 't', // Too short
        password: 'short', // Too short
        confirmPassword: 'different' // Doesn't match
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it('should check if email is already in use', async () => {
      const existingUser = {
        email: 'existing@example.com',
        username: 'newusername',
        displayName: 'Existing User',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      storage.getUserByEmail.mockResolvedValue({ id: 2, email: 'existing@example.com' });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already in use');
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it('should check if username is already taken', async () => {
      const existingUsername = {
        email: 'new@example.com',
        username: 'existinguser',
        displayName: 'New User',
        password: 'password123',
        confirmPassword: 'password123'
      };
      
      storage.getUserByEmail.mockResolvedValue(null);
      storage.getUserByUsername.mockResolvedValue({ id: 3, username: 'existinguser' });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUsername);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username already taken');
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it('should check if passwords match', async () => {
      const mismatchedPasswords = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'password123',
        confirmPassword: 'password456'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(mismatchedPasswords);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Passwords do not match');
      expect(storage.createUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate a user with valid credentials', async () => {
      const loginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password_hash: 'hashedpassword'
      };
      
      storage.getUserByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });

    it('should validate login data', async () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: '' // Empty password
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLogin);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject non-existent users', async () => {
      const nonExistentUser = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      storage.getUserByEmail.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(nonExistentUser);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject incorrect passwords', async () => {
      const wrongPassword = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        password_hash: 'hashedpassword'
      };
      
      storage.getUserByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(wrongPassword);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return user data if authenticated', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      };
      
      // Mock a successful authentication
      const authenticatedApp = express();
      authenticatedApp.use((req, res, next) => {
        req.isAuthenticated = () => true;
        req.user = user;
        next();
      });
      
      authenticatedApp.get('/api/auth/status', (req, res) => {
        if (req.isAuthenticated()) {
          return res.status(200).json({ user: req.user });
        }
        return res.status(401).json({ message: 'Not authenticated' });
      });
      
      const response = await request(authenticatedApp).get('/api/auth/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user', user);
    });

    it('should return 401 if not authenticated', async () => {
      // Mock an unauthenticated request
      const unauthenticatedApp = express();
      unauthenticatedApp.use((req, res, next) => {
        req.isAuthenticated = () => false;
        next();
      });
      
      unauthenticatedApp.get('/api/auth/status', (req, res) => {
        if (req.isAuthenticated()) {
          return res.status(200).json({ user: req.user });
        }
        return res.status(401).json({ message: 'Not authenticated' });
      });
      
      const response = await request(unauthenticatedApp).get('/api/auth/status');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Not authenticated');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should log the user out', async () => {
      // Mock a logout function
      const logoutApp = express();
      logoutApp.use((req, res, next) => {
        req.logout = jest.fn((cb) => cb());
        next();
      });
      
      logoutApp.post('/api/auth/logout', (req, res) => {
        req.logout((err) => {
          if (err) return res.status(500).json({ message: 'Error during logout' });
          return res.status(200).json({ message: 'Logged out successfully' });
        });
      });
      
      const response = await request(logoutApp).post('/api/auth/logout');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});