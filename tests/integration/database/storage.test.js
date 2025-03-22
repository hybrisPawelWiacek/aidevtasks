const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const { PostgresStorage } = require('../../../server/pg-storage');
const { db } = require('../../../server/db');

// Mock the Drizzle ORM
jest.mock('../../../server/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue([])
        }))
      }))
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([])
      }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([])
        }))
      }))
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([])
      }))
    }))
  }
}));

// Mock the schema
jest.mock('@shared/schema', () => ({
  users: { id: { name: 'id' }, username: { name: 'username' }, email: { name: 'email' } },
  tasks: { id: { name: 'id' }, userId: { name: 'user_id' } }
}));

describe('PostgresStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new PostgresStorage();
    jest.clearAllMocks();
  });

  describe('User Operations', () => {
    it('should fetch a user by ID', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      
      // Set up the mock to return a user
      const mockLimit = jest.fn().mockResolvedValue([mockUser]);
      const mockWhere = jest.fn(() => ({ limit: mockLimit }));
      const mockFrom = jest.fn(() => ({ where: mockWhere }));
      db.select.mockReturnValue({ from: mockFrom });
      
      const result = await storage.getUser(1);
      
      expect(result).toEqual(mockUser);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should fetch a user by username', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      
      // Set up the mock to return a user
      const mockLimit = jest.fn().mockResolvedValue([mockUser]);
      const mockWhere = jest.fn(() => ({ limit: mockLimit }));
      const mockFrom = jest.fn(() => ({ where: mockWhere }));
      db.select.mockReturnValue({ from: mockFrom });
      
      const result = await storage.getUserByUsername('testuser');
      
      expect(result).toEqual(mockUser);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should fetch a user by email', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      
      // Set up the mock to return a user
      const mockLimit = jest.fn().mockResolvedValue([mockUser]);
      const mockWhere = jest.fn(() => ({ limit: mockLimit }));
      const mockFrom = jest.fn(() => ({ where: mockWhere }));
      db.select.mockReturnValue({ from: mockFrom });
      
      const result = await storage.getUserByEmail('test@example.com');
      
      expect(result).toEqual(mockUser);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should create a user', async () => {
      const newUser = { username: 'newuser', email: 'new@example.com', displayName: 'New User' };
      const createdUser = { id: 2, ...newUser };
      
      // Set up the mock to return a created user
      const mockReturning = jest.fn().mockResolvedValue([createdUser]);
      const mockValues = jest.fn(() => ({ returning: mockReturning }));
      db.insert.mockReturnValue({ values: mockValues });
      
      const result = await storage.createUser(newUser);
      
      expect(result).toEqual(createdUser);
      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(newUser);
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should update a user', async () => {
      const userId = 1;
      const updateData = { displayName: 'Updated Name' };
      const updatedUser = { id: userId, username: 'testuser', email: 'test@example.com', displayName: 'Updated Name' };
      
      // Set up the mock to return an updated user
      const mockReturning = jest.fn().mockResolvedValue([updatedUser]);
      const mockWhere = jest.fn(() => ({ returning: mockReturning }));
      const mockSet = jest.fn(() => ({ where: mockWhere }));
      db.update.mockReturnValue({ set: mockSet });
      
      const result = await storage.updateUser(userId, updateData);
      
      expect(result).toEqual(updatedUser);
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(updateData);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
    });
  });

  describe('Task Operations', () => {
    it('should fetch a task by ID', async () => {
      const mockTask = { id: 1, title: 'Test Task', userId: 1 };
      
      // Set up the mock to return a task
      const mockLimit = jest.fn().mockResolvedValue([mockTask]);
      const mockWhere = jest.fn(() => ({ limit: mockLimit }));
      const mockFrom = jest.fn(() => ({ where: mockWhere }));
      db.select.mockReturnValue({ from: mockFrom });
      
      const result = await storage.getTask(1);
      
      expect(result).toEqual(mockTask);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should fetch tasks by user ID', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', userId: 1 },
        { id: 2, title: 'Task 2', userId: 1 }
      ];
      
      // Set up the mock to return tasks
      const mockWhere = jest.fn().mockResolvedValue(mockTasks);
      const mockFrom = jest.fn(() => ({ where: mockWhere }));
      db.select.mockReturnValue({ from: mockFrom });
      
      const result = await storage.getTasksByUserId(1);
      
      expect(result).toEqual(mockTasks);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should create a task', async () => {
      const newTask = { 
        title: 'New Task', 
        description: 'Task description', 
        priority: 'medium', 
        dueDate: '2023-03-01', 
        userId: 1 
      };
      const createdTask = { id: 3, ...newTask, completed: false };
      
      // Set up the mock to return a created task
      const mockReturning = jest.fn().mockResolvedValue([createdTask]);
      const mockValues = jest.fn(() => ({ returning: mockReturning }));
      db.insert.mockReturnValue({ values: mockValues });
      
      const result = await storage.createTask(newTask);
      
      expect(result).toEqual(createdTask);
      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(newTask);
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should update a task', async () => {
      const taskId = 1;
      const updateData = { 
        title: 'Updated Task', 
        priority: 'high' 
      };
      const updatedTask = { 
        id: taskId, 
        title: 'Updated Task', 
        description: 'Task description', 
        priority: 'high', 
        dueDate: '2023-03-01', 
        userId: 1,
        completed: false
      };
      
      // Set up the mock to return an updated task
      const mockReturning = jest.fn().mockResolvedValue([updatedTask]);
      const mockWhere = jest.fn(() => ({ returning: mockReturning }));
      const mockSet = jest.fn(() => ({ where: mockWhere }));
      db.update.mockReturnValue({ set: mockSet });
      
      const result = await storage.updateTask(taskId, updateData);
      
      expect(result).toEqual(updatedTask);
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(updateData);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should update task completion status', async () => {
      const taskId = 1;
      const completed = true;
      const updatedTask = { 
        id: taskId, 
        title: 'Test Task', 
        completed: true, 
        userId: 1 
      };
      
      // Set up the mock to return an updated task
      const mockReturning = jest.fn().mockResolvedValue([updatedTask]);
      const mockWhere = jest.fn(() => ({ returning: mockReturning }));
      const mockSet = jest.fn(() => ({ where: mockWhere }));
      db.update.mockReturnValue({ set: mockSet });
      
      const result = await storage.updateTaskCompletion(taskId, completed);
      
      expect(result).toEqual(updatedTask);
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ completed });
      expect(mockWhere).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should delete a task', async () => {
      const taskId = 1;
      
      // Set up the mock for delete operation
      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn(() => ({ returning: mockReturning }));
      db.delete.mockReturnValue({ where: mockWhere });
      
      await storage.deleteTask(taskId);
      
      expect(db.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});