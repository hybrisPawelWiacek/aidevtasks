import { type User, type InsertUser, type Task, type InsertTask } from "@shared/schema";
import { PostgresStorage } from './pg-storage';

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

// Use PostgreSQL storage
export const storage = new PostgresStorage();
