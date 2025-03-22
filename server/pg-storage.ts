import { db } from './db';
import { IStorage } from './storage';
import { Task, User, InsertTask, InsertUser, tasks, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Create the user with required fields
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      email: insertUser.email,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      googleId: insertUser.googleId || null,
      password: insertUser.password || null, // For backward compatibility
      password_hash: insertUser.password_hash || null, // Store hashed password for security
    }).returning();
    
    return user;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values({
      title: task.title,
      description: task.description || null,
      dueDate: task.dueDate,
      priority: task.priority || 'medium',
      completed: task.completed === undefined ? false : task.completed,
      category: task.category || null,
      userId: task.userId,
    }).returning();
    
    return newTask;
  }

  async updateTask(id: number, updateData: InsertTask): Promise<Task> {
    const [updatedTask] = await db.update(tasks)
      .set({
        title: updateData.title,
        description: updateData.description || null,
        dueDate: updateData.dueDate,
        priority: updateData.priority || 'medium',
        completed: updateData.completed === undefined ? false : updateData.completed,
        category: updateData.category || null,
        userId: updateData.userId,
      })
      .where(eq(tasks.id, id))
      .returning();
    
    if (!updatedTask) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    return updatedTask;
  }

  async updateTaskCompletion(id: number, completed: boolean): Promise<Task> {
    const [updatedTask] = await db.update(tasks)
      .set({ completed })
      .where(eq(tasks.id, id))
      .returning();
    
    if (!updatedTask) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
    
    if (result.length === 0) {
      throw new Error(`Task with id ${id} not found`);
    }
  }
}