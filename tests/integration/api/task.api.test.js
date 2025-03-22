import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import supertest from 'supertest';
import express from 'express';
import { registerRoutes } from '../../../server/routes';

// Mock authentication middleware for routes
jest.mock('../../../server/routes', () => {
  const originalModule = jest.requireActual('../../../server/routes');
  
  // A modified version that skips authentication checks
  return {
    ...originalModule,
    registerRoutes: async (app) => {
      // Add auth middleware mock
      app.use((req, res, next) => {
        // Set authenticated user for all requests
        req.isAuthenticated = () => true;
        req.user = { id: 1, username: 'testuser' };
        next();
      });
      
      // Register the actual routes
      const server = await originalModule.registerRoutes(app);
      return server;
    }
  };
});

// Mock storage implementation
jest.mock('../../../server/pg-storage', () => {
  // Sample tasks for testing
  const tasks = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      completed: false,
      userId: 1,
      priority: 'high',
      category: 'work',
      dueDate: '2025-03-30T12:00:00.000Z'
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      completed: true,
      userId: 1,
      priority: 'medium',
      category: 'personal',
      dueDate: '2025-04-15T12:00:00.000Z'
    }
  ];
  
  let nextId = 3;
  
  return {
    PostgresStorage: jest.fn().mockImplementation(() => ({
      getTasksByUserId: jest.fn().mockImplementation(() => {
        return Promise.resolve([...tasks]);
      }),
      getTask: jest.fn().mockImplementation((id) => {
        const task = tasks.find(t => t.id === id);
        return Promise.resolve(task || null);
      }),
      createTask: jest.fn().mockImplementation((taskData) => {
        const newTask = {
          id: nextId++,
          ...taskData,
          completed: false
        };
        tasks.push(newTask);
        return Promise.resolve(newTask);
      }),
      updateTask: jest.fn().mockImplementation((id, taskData) => {
        const index = tasks.findIndex(t => t.id === id);
        if (index >= 0) {
          const updatedTask = {
            ...tasks[index],
            ...taskData
          };
          tasks[index] = updatedTask;
          return Promise.resolve(updatedTask);
        }
        return Promise.resolve(null);
      }),
      updateTaskCompletion: jest.fn().mockImplementation((id, completed) => {
        const index = tasks.findIndex(t => t.id === id);
        if (index >= 0) {
          tasks[index].completed = completed;
          return Promise.resolve(tasks[index]);
        }
        return Promise.resolve(null);
      }),
      deleteTask: jest.fn().mockImplementation((id) => {
        const index = tasks.findIndex(t => t.id === id);
        if (index >= 0) {
          tasks.splice(index, 1);
        }
        return Promise.resolve();
      })
    }))
  };
});

describe('Task API Integration Tests', () => {
  let app;
  let request;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Initialize routes with authentication bypass
    await registerRoutes(app);
    
    request = supertest(app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks for the authenticated user', async () => {
      const response = await request
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id', 1);
      expect(response.body[1]).toHaveProperty('id', 2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a specific task by ID', async () => {
      const response = await request
        .get('/api/tasks/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('title', 'Task 1');
    });

    it('should return 404 for non-existent task', async () => {
      await request
        .get('/api/tasks/999')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Task Description',
        priority: 'medium',
        category: 'work',
        dueDate: '2025-05-01T12:00:00.000Z'
      };

      const response = await request
        .post('/api/tasks')
        .send(newTask)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', newTask.title);
      expect(response.body).toHaveProperty('userId', 1); // From the auth mock
      expect(response.body).toHaveProperty('completed', false);
    });

    it('should return 400 for invalid task data', async () => {
      const invalidTask = {
        // Missing required title
        description: 'Invalid Task'
      };

      await request
        .post('/api/tasks')
        .send(invalidTask)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      const updateData = {
        title: 'Updated Task 1',
        description: 'Updated Description'
      };

      const response = await request
        .patch('/api/tasks/1')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('description', updateData.description);
    });

    it('should return 404 for non-existent task', async () => {
      await request
        .patch('/api/tasks/999')
        .send({ title: 'Updated Title' })
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    it('should mark a task as complete', async () => {
      const response = await request
        .post('/api/tasks/1/complete')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('completed', true);
    });

    it('should return 404 for non-existent task', async () => {
      await request
        .post('/api/tasks/999/complete')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('POST /api/tasks/:id/incomplete', () => {
    it('should mark a task as incomplete', async () => {
      const response = await request
        .post('/api/tasks/2/incomplete')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).toHaveProperty('completed', false);
    });

    it('should return 404 for non-existent task', async () => {
      await request
        .post('/api/tasks/999/incomplete')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      await request
        .delete('/api/tasks/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify the task is deleted by trying to get it
      await request
        .get('/api/tasks/1')
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      await request
        .delete('/api/tasks/999')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });
});