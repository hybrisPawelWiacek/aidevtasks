import { users, type User, type InsertUser, tasks, type Task, type InsertTask } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: InsertTask): Promise<Task>;
  updateTaskCompletion(id: number, completed: boolean): Promise<Task>;
  deleteTask(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private userIdCounter: number;
  private taskIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      password: null
    };
    this.users.set(id, user);
    
    // Create demo tasks for new users
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Demo task 1: High priority due today
    await this.createTask({
      title: "Set up development environment",
      description: "Install required tools and dependencies for AI development",
      dueDate: today.toISOString().split('T')[0],
      priority: "high",
      completed: false,
      category: "Infrastructure",
      userId: id
    });
    
    // Demo task 2: Medium priority due tomorrow
    await this.createTask({
      title: "Review machine learning concepts",
      description: "Study neural networks, supervised learning, and classification algorithms",
      dueDate: tomorrow.toISOString().split('T')[0],
      priority: "medium",
      completed: false,
      category: "ML Fundamentals",
      userId: id
    });
    
    // Demo task 3: Low priority due next week
    await this.createTask({
      title: "Explore NLP techniques",
      description: "Learn about text preprocessing, tokenization, and embedding techniques",
      dueDate: nextWeek.toISOString().split('T')[0],
      priority: "low",
      completed: false,
      category: "NLP",
      userId: id
    });
    
    // Demo task 4: Completed task
    await this.createTask({
      title: "Install Python and necessary libraries",
      description: "Set up virtual environment with TensorFlow and PyTorch",
      dueDate: today.toISOString().split('T')[0],
      priority: "medium",
      completed: true,
      category: "Programming",
      userId: id
    });
    
    return user;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: InsertTask): Promise<Task> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: Task = { ...existingTask, ...updateData, id };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async updateTaskCompletion(id: number, completed: boolean): Promise<Task> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: Task = { ...existingTask, completed };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    if (!this.tasks.has(id)) {
      throw new Error(`Task with id ${id} not found`);
    }
    this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
