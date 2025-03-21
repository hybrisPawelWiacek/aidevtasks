import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { insertTaskSchema, taskValidationSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";

const SESSION_SECRET = process.env.SESSION_SECRET || "ai-dev-tasks-secret";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 }, // 1 day
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Mock Google auth without using actual Google OAuth
  // A real implementation would use passport-google-oauth20
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { email, displayName, photoURL } = req.body;
      
      // Validate required fields
      if (!email || !displayName) {
        return res.status(400).json({ message: "Email and display name are required" });
      }

      // Check if user exists by email
      let user = await storage.getUserByEmail(email);
      
      // Create user if doesn't exist
      if (!user) {
        const username = email.split("@")[0];
        user = await storage.createUser({
          email,
          displayName,
          photoURL,
          username,
          googleId: "google-" + Math.random().toString(36).substring(2, 15)
        });
      }
      
      // Set user in session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in" });
        }
        return res.status(200).json(user);
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error during login" });
    }
  });

  // Auth status check
  app.get("/api/auth/status", (req, res) => {
    if (req.user) {
      return res.status(200).json({ user: req.user });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Tasks API
  // Get all tasks for current user
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const tasks = await storage.getTasksByUserId(userId);
      return res.status(200).json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Server error fetching tasks" });
    }
  });

  // Create task
  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const taskData = { ...req.body, userId };
      
      // Validate task data
      const validatedData = taskValidationSchema.parse(taskData);
      
      const task = await storage.createTask(validatedData);
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating task:", error);
      return res.status(500).json({ message: "Server error creating task" });
    }
  });

  // Update task
  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const taskId = parseInt(req.params.id);
      
      // Check if task exists and belongs to user
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (existingTask.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this task" });
      }
      
      // Validate task data
      const taskData = { ...req.body, userId };
      const validatedData = taskValidationSchema.parse(taskData);
      
      const updatedTask = await storage.updateTask(taskId, validatedData);
      return res.status(200).json(updatedTask);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Server error updating task" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const taskId = parseInt(req.params.id);
      
      // Check if task exists and belongs to user
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (existingTask.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this task" });
      }
      
      await storage.deleteTask(taskId);
      return res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Server error deleting task" });
    }
  });

  // Update task completion status
  app.patch("/api/tasks/:id/complete", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const taskId = parseInt(req.params.id);
      const { completed } = req.body;
      
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ message: "Completed status must be a boolean" });
      }
      
      // Check if task exists and belongs to user
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (existingTask.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this task" });
      }
      
      const updatedTask = await storage.updateTaskCompletion(taskId, completed);
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error("Error updating task completion:", error);
      return res.status(500).json({ message: "Server error updating task completion" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
