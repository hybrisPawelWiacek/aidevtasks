import { users, type User, type InsertUser, tasks, type Task, type InsertTask } from "@shared/schema";
import { db } from './db';
import { eq } from 'drizzle-orm';
import { createDemoTasks } from './db';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: InsertTask): Promise<Task>;
  updateTaskCompletion(id: number, completed: boolean): Promise<Task>;
  deleteTask(id: number): Promise<void>;
}

export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    // Create the user with required fields
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      email: insertUser.email,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      googleId: insertUser.googleId || null,
      password: insertUser.password || null, // For compatibility
      password_hash: insertUser.password_hash || null, // For storing secure password hash
    }).returning();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    // Get current user data
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    // Update the user with merged data
    const [updatedUser] = await db.update(users)
      .set({
        username: userData.username || existingUser.username,
        email: userData.email || existingUser.email,
        displayName: userData.displayName !== undefined ? userData.displayName : existingUser.displayName,
        photoURL: userData.photoURL !== undefined ? userData.photoURL : existingUser.photoURL,
        googleId: userData.googleId !== undefined ? userData.googleId : existingUser.googleId,
        password: userData.password !== undefined ? userData.password : existingUser.password,
        password_hash: (userData as any).password_hash !== undefined ? (userData as any).password_hash : (existingUser as any).password_hash,
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`Failed to update user with id ${id}`);
    }
    
    return updatedUser;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
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

// Use PostgreSQL storage instead of MemStorage
export const storage = new PostgresStorage();
