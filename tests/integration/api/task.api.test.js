const { describe, it, expect, beforeEach, jest, afterAll, beforeAll } = require('@jest/globals');
const request = require('supertest');
const express = require('express');
const { registerRoutes } = require('../../../server/routes');
const { storage } = require('../../../server/storage');

// Mock the storage implementation
jest.mock('../../../server/storage', () => ({
  storage: {
    getTasksByUserId: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    updateTaskCompletion: jest.fn(),
    deleteTask: jest.fn(),
    getTask: jest.fn()
  }
}));

// Mock authentication middleware
jest.mock('../../../server/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    next();
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

describe('Task API Endpoints', () => {
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

  describe('GET /api/tasks', () => {
    it('should return tasks for the authenticated user', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', userId: 1 },
        { id: 2, title: 'Task 2', userId: 1 }
      ];
      
      storage.getTasksByUserId.mockResolvedValue(mockTasks);
      
      const response = await request(app).get('/api/tasks');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(storage.getTasksByUserId).toHaveBeenCalledWith(1);
    });

    it('should handle errors when fetching tasks', async () => {
      storage.getTasksByUserId.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/tasks');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error fetching tasks');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task for the authenticated user', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium',
        dueDate: '2023-03-01',
        category: 'Work'
      };
      
      const createdTask = { 
        id: 3, 
        ...newTask, 
        userId: 1,
        completed: false
      };
      
      storage.createTask.mockResolvedValue(createdTask);
      
      const response = await request(app)
        .post('/api/tasks')
        .send(newTask);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdTask);
      expect(storage.createTask).toHaveBeenCalledWith({
        ...newTask,
        userId: 1
      });
    });

    it('should validate task data before creating', async () => {
      const invalidTask = {
        // Missing required title
        description: 'Task description',
        priority: 'invalid-priority', // Invalid priority
        dueDate: '2023-03-01',
        category: 'Work'
      };
      
      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(storage.createTask).not.toHaveBeenCalled();
    });

    it('should handle errors when creating a task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium',
        dueDate: '2023-03-01',
        category: 'Work'
      };
      
      storage.createTask.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/tasks')
        .send(newTask);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Server error creating task');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task for the authenticated user', async () => {
      const taskId = 1;
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'high',
        dueDate: '2023-03-15',
        category: 'Personal'
      };
      
      const originalTask = {
        id: taskId,
        title: 'Original Task',
        description: 'Original description',
        priority: 'medium',
        dueDate: '2023-03-01',
        category: 'Work',
        completed: false,
        userId: 1
      };
      
      const updatedTask = {
        ...originalTask,
        ...updateData
      };
      
      storage.getTask.mockResolvedValue(originalTask);
      storage.updateTask.mockResolvedValue(updatedTask);
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTask);
      expect(storage.updateTask).toHaveBeenCalledWith(taskId, {
        ...updateData,
        userId: 1
      });
    });

    it('should return 404 if task is not found', async () => {
      const taskId = 999;
      storage.getTask.mockResolvedValue(undefined);
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Task',
          priority: 'high',
          dueDate: '2023-03-15'
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Task not found');
      expect(storage.updateTask).not.toHaveBeenCalled();
    });

    it('should return 403 if user tries to update another user\'s task', async () => {
      const taskId = 2;
      const originalTask = {
        id: taskId,
        title: 'Another User\'s Task',
        userId: 2 // Different from authenticated user (id: 1)
      };
      
      storage.getTask.mockResolvedValue(originalTask);
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Trying to update',
          priority: 'high',
          dueDate: '2023-03-15'
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to update this task');
      expect(storage.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    it('should update the completion status of a task', async () => {
      const taskId = 1;
      const originalTask = {
        id: taskId,
        title: 'Task to complete',
        completed: false,
        userId: 1
      };
      
      const updatedTask = {
        ...originalTask,
        completed: true
      };
      
      storage.getTask.mockResolvedValue(originalTask);
      storage.updateTaskCompletion.mockResolvedValue(updatedTask);
      
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .send({ completed: true });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTask);
      expect(storage.updateTaskCompletion).toHaveBeenCalledWith(taskId, true);
    });

    it('should return 404 if task is not found', async () => {
      const taskId = 999;
      storage.getTask.mockResolvedValue(undefined);
      
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .send({ completed: true });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Task not found');
      expect(storage.updateTaskCompletion).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task belonging to the authenticated user', async () => {
      const taskId = 1;
      const taskToDelete = {
        id: taskId,
        title: 'Task to delete',
        userId: 1
      };
      
      storage.getTask.mockResolvedValue(taskToDelete);
      storage.deleteTask.mockResolvedValue(undefined);
      
      const response = await request(app).delete(`/api/tasks/${taskId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Task deleted successfully');
      expect(storage.deleteTask).toHaveBeenCalledWith(taskId);
    });

    it('should return 404 if task is not found', async () => {
      const taskId = 999;
      storage.getTask.mockResolvedValue(undefined);
      
      const response = await request(app).delete(`/api/tasks/${taskId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Task not found');
      expect(storage.deleteTask).not.toHaveBeenCalled();
    });

    it('should return 403 if user tries to delete another user\'s task', async () => {
      const taskId = 2;
      const taskToDelete = {
        id: taskId,
        title: 'Another User\'s Task',
        userId: 2 // Different from authenticated user (id: 1)
      };
      
      storage.getTask.mockResolvedValue(taskToDelete);
      
      const response = await request(app).delete(`/api/tasks/${taskId}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to delete this task');
      expect(storage.deleteTask).not.toHaveBeenCalled();
    });
  });
});