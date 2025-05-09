import { db } from './db';
import { IStorage } from './storage';
import { Task, User, InsertTask, InsertUser, tasks, users, userCategories, UserCategory, InsertUserCategory } from '@shared/schema';
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
      contentLink: task.contentLink || null,
      contentType: task.contentType || null,
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
  
  async getUserCategories(userId: number): Promise<UserCategory[]> {
    return await db.select().from(userCategories).where(eq(userCategories.userId, userId));
  }
  
  async createUserCategory(category: InsertUserCategory): Promise<UserCategory> {
    try {
      const [newCategory] = await db.insert(userCategories).values({
        name: category.name,
        userId: category.userId,
      }).returning();
      
      return newCategory;
    } catch (error) {
      // Catch duplicate category error and provide user-friendly message
      if ((error as any)?.code === '23505') { // PostgreSQL unique constraint violation
        throw new Error(`Category '${category.name}' already exists for this user`);
      }
      throw error;
    }
  }
  
  async deleteUserCategory(id: number): Promise<void> {
    const result = await db.delete(userCategories).where(eq(userCategories.id, id)).returning({ id: userCategories.id });
    
    if (result.length === 0) {
      throw new Error(`Category with id ${id} not found`);
    }
  }
}