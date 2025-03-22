import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { PostgresStorage } from '../../../server/pg-storage';
import * as db from '../../../server/db';
import { users, tasks } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

// Mock database module
jest.mock('../../../server/db', () => {
  // Track inserted and modified data
  const dbState = {
    users: [
      {
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        photoURL: null,
        googleId: null
      }
    ],
    tasks: [
      {
        id: 1,
        title: 'Task 1',
        description: 'Description 1',
        completed: false,
        userId: 1,
        priority: 'high',
        category: 'work',
        dueDate: new Date('2025-03-30T12:00:00.000Z')
      },
      {
        id: 2,
        title: 'Task 2',
        description: 'Description 2',
        completed: true,
        userId: 1,
        priority: 'medium',
        category: 'personal',
        dueDate: new Date('2025-04-15T12:00:00.000Z')
      }
    ]
  };

  // Reset the dbState between tests
  const resetState = () => {
    dbState.users = [
      {
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        photoURL: null,
        googleId: null
      }
    ];
    dbState.tasks = [
      {
        id: 1,
        title: 'Task 1',
        description: 'Description 1',
        completed: false,
        userId: 1,
        priority: 'high',
        category: 'work',
        dueDate: new Date('2025-03-30T12:00:00.000Z')
      },
      {
        id: 2,
        title: 'Task 2',
        description: 'Description 2',
        completed: true,
        userId: 1,
        priority: 'medium',
        category: 'personal',
        dueDate: new Date('2025-04-15T12:00:00.000Z')
      }
    ];
  };

  // Mock DB object with query methods
  const mockDb = {
    select: jest.fn().mockImplementation((fields) => ({
      from: (table) => ({
        where: (condition) => {
          // Handle user queries
          if (table === users) {
            if (condition && condition.left && condition.left.name === 'id') {
              const id = condition.right;
              return Promise.resolve(dbState.users.filter(user => user.id === id));
            }
            if (condition && condition.left && condition.left.name === 'username') {
              const username = condition.right;
              return Promise.resolve(dbState.users.filter(user => user.username === username));
            }
            if (condition && condition.left && condition.left.name === 'email') {
              const email = condition.right;
              return Promise.resolve(dbState.users.filter(user => user.email === email));
            }
            return Promise.resolve(dbState.users);
          }
          
          // Handle task queries
          if (table === tasks) {
            if (condition && condition.left && condition.left.name === 'id') {
              const id = condition.right;
              return Promise.resolve(dbState.tasks.filter(task => task.id === id));
            }
            if (condition && condition.left && condition.left.name === 'userId') {
              const userId = condition.right;
              return Promise.resolve(dbState.tasks.filter(task => task.userId === userId));
            }
            return Promise.resolve(dbState.tasks);
          }
          
          return Promise.resolve([]);
        }
      })
    })),
    
    insert: jest.fn().mockImplementation((table) => ({
      values: (data) => ({
        returning: () => {
          if (table === users) {
            const newUser = { 
              id: dbState.users.length > 0 ? Math.max(...dbState.users.map(u => u.id)) + 1 : 1,
              ...data 
            };
            dbState.users.push(newUser);
            return Promise.resolve([newUser]);
          }
          
          if (table === tasks) {
            const newTask = { 
              id: dbState.tasks.length > 0 ? Math.max(...dbState.tasks.map(t => t.id)) + 1 : 1,
              ...data,
              dueDate: data.dueDate ? new Date(data.dueDate) : null
            };
            dbState.tasks.push(newTask);
            return Promise.resolve([newTask]);
          }
          
          return Promise.resolve([data]);
        }
      })
    })),
    
    update: jest.fn().mockImplementation((table) => ({
      set: (updateData) => ({
        where: (condition) => ({
          returning: () => {
            if (table === users && condition.left && condition.left.name === 'id') {
              const userId = condition.right;
              const userIndex = dbState.users.findIndex(user => user.id === userId);
              
              if (userIndex >= 0) {
                dbState.users[userIndex] = { ...dbState.users[userIndex], ...updateData };
                return Promise.resolve([dbState.users[userIndex]]);
              }
            }
            
            if (table === tasks && condition.left && condition.left.name === 'id') {
              const taskId = condition.right;
              const taskIndex = dbState.tasks.findIndex(task => task.id === taskId);
              
              if (taskIndex >= 0) {
                dbState.tasks[taskIndex] = { 
                  ...dbState.tasks[taskIndex], 
                  ...updateData,
                  dueDate: updateData.dueDate ? new Date(updateData.dueDate) : dbState.tasks[taskIndex].dueDate
                };
                return Promise.resolve([dbState.tasks[taskIndex]]);
              }
            }
            
            return Promise.resolve([]);
          }
        })
      })
    })),
    
    delete: jest.fn().mockImplementation((table) => ({
      where: (condition) => ({
        returning: () => {
          if (table === tasks && condition.left && condition.left.name === 'id') {
            const taskId = condition.right;
            const taskIndex = dbState.tasks.findIndex(task => task.id === taskId);
            
            if (taskIndex >= 0) {
              const deletedTask = dbState.tasks[taskIndex];
              dbState.tasks.splice(taskIndex, 1);
              return Promise.resolve([deletedTask]);
            }
          }
          
          return Promise.resolve([]);
        }
      })
    }))
  };

  return {
    ...jest.requireActual('../../../server/db'),
    db: mockDb,
    resetMockDbState: resetState
  };
});

describe('PostgresStorage Integration Tests', () => {
  let storage;
  
  beforeEach(() => {
    // Reset the mock database state before each test
    db.resetMockDbState && db.resetMockDbState();
    
    // Create a new instance of PostgresStorage for each test
    storage = new PostgresStorage();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('User operations', () => {
    it('should get a user by ID', async () => {
      const user = await storage.getUser(1);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.username).toBe('testuser');
    });
    
    it('should return undefined for non-existent user ID', async () => {
      const user = await storage.getUser(999);
      
      expect(user).toBeUndefined();
    });
    
    it('should get a user by username', async () => {
      const user = await storage.getUserByUsername('testuser');
      
      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
    });
    
    it('should get a user by email', async () => {
      const user = await storage.getUserByEmail('test@example.com');
      
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
    
    it('should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        displayName: 'New User',
        email: 'new@example.com',
        password: 'hashed_password_new'
      };
      
      const created = await storage.createUser(newUser);
      
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.username).toBe(newUser.username);
      expect(created.email).toBe(newUser.email);
      
      // Verify user was actually added to the mock database
      const retrieved = await storage.getUserByEmail('new@example.com');
      expect(retrieved).toBeDefined();
      expect(retrieved.username).toBe('newuser');
    });
    
    it('should update a user', async () => {
      const updateData = {
        displayName: 'Updated User Name'
      };
      
      const updated = await storage.updateUser(1, updateData);
      
      expect(updated).toBeDefined();
      expect(updated.id).toBe(1);
      expect(updated.displayName).toBe(updateData.displayName);
      
      // Original fields should remain unchanged
      expect(updated.username).toBe('testuser');
      expect(updated.email).toBe('test@example.com');
    });
  });
  
  describe('Task operations', () => {
    it('should get a task by ID', async () => {
      const task = await storage.getTask(1);
      
      expect(task).toBeDefined();
      expect(task.id).toBe(1);
      expect(task.title).toBe('Task 1');
    });
    
    it('should return undefined for non-existent task ID', async () => {
      const task = await storage.getTask(999);
      
      expect(task).toBeUndefined();
    });
    
    it('should get all tasks for a user', async () => {
      const tasks = await storage.getTasksByUserId(1);
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });
    
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Task Description',
        userId: 1,
        completed: false,
        priority: 'low',
        category: 'study',
        dueDate: '2025-05-01T12:00:00.000Z'
      };
      
      const created = await storage.createTask(newTask);
      
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.title).toBe(newTask.title);
      expect(created.userId).toBe(newTask.userId);
      
      // Verify task was actually added to the mock database
      const retrieved = await storage.getTask(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.title).toBe('New Task');
    });
    
    it('should update a task', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated Description'
      };
      
      const updated = await storage.updateTask(1, updateData);
      
      expect(updated).toBeDefined();
      expect(updated.id).toBe(1);
      expect(updated.title).toBe(updateData.title);
      expect(updated.description).toBe(updateData.description);
      
      // Original fields should remain unchanged
      expect(updated.userId).toBe(1);
      expect(updated.priority).toBe('high');
    });
    
    it('should update task completion status', async () => {
      // Task 1 is initially not completed
      const updated = await storage.updateTaskCompletion(1, true);
      
      expect(updated).toBeDefined();
      expect(updated.id).toBe(1);
      expect(updated.completed).toBe(true);
      
      // Verify completion status persists
      const retrieved = await storage.getTask(1);
      expect(retrieved.completed).toBe(true);
    });
    
    it('should delete a task', async () => {
      await storage.deleteTask(1);
      
      // Verify task no longer exists
      const deleted = await storage.getTask(1);
      expect(deleted).toBeUndefined();
      
      // Verify other tasks still exist
      const remaining = await storage.getTasksByUserId(1);
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(2);
    });
  });
});