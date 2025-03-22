import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { insertTaskSchema, taskValidationSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import MemoryStore from "memorystore";
import ConnectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { PostgresStorage } from "./pg-storage";
import { initializeDatabase, createDemoTasks, initializeSessionTable } from "./db";

// Initialize environment variables
dotenv.config();

// Production configuration
// For Replit, check if REPLIT_ENVIRONMENT is defined or manually set to production 
// and default to development if not explicitly set
const isProduction = process.env.REPLIT_ENVIRONMENT === "production" || process.env.NODE_ENV === "production";
const SESSION_SECRET = process.env.SESSION_SECRET || "ai-dev-tasks-secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// For production, always use the correct callback URL for the deployed app
const CALLBACK_URL = isProduction 
  ? "https://todo.agentforce.io/api/auth/google/callback" 
  : (process.env.CALLBACK_URL || "http://localhost:5000/api/auth/google/callback");
const DOMAIN = isProduction ? "todo.agentforce.io" : (process.env.DOMAIN || "localhost");

// Debug for deployment troubleshooting
console.log("Environment Info:", {
  isProduction,
  callbackURL: CALLBACK_URL,
  hasClientId: !!GOOGLE_CLIENT_ID,
  hasClientSecret: !!GOOGLE_CLIENT_SECRET
});

// Initialize storage
const storage = new PostgresStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initializeDatabase();

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all API routes
  app.use("/api", apiLimiter);

  // Configure session with PostgreSQL for production or memory for development
  let sessionConfig: session.SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: isProduction, 
      maxAge: 86400000, // 1 day
      sameSite: isProduction ? 'none' : 'lax',
      // Don't explicitly set domain in production as it can cause issues with top-level domains
      // If a specific subdomain needs to be used, then domain can be set
    }
  };
  
  // Use PostgreSQL session store in production for autoscaling support
  if (isProduction) {
    const PgSessionStore = ConnectPgSimple(session);
    
    // Create session table in the database if it doesn't exist
    await initializeSessionTable();
    
    sessionConfig.store = new PgSessionStore({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 24 * 60 * 60 * 1000 // Prune once per day
    });
  } else {
    // Use memory store for development
    const MemoryStoreSession = MemoryStore(session);
    sessionConfig.store = new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }
  
  app.use(session(sessionConfig));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport serialization
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

  // Configure Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const photoURL = profile.photos?.[0]?.value;
        
        if (!email) {
          return done(new Error("Email is required from Google profile"), false);
        }
        
        // Check if user exists
        let user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Create new user
          const username = email.split("@")[0];
          user = await storage.createUser({
            email,
            displayName,
            photoURL,
            username,
            googleId: profile.id
          });
          
          // Create demo tasks for new user
          await createDemoTasks(user.id);
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Error in Google OAuth strategy:", error);
        return done(error as Error, false);
      }
    }));
  } else {
    console.warn("Google OAuth credentials not found in environment variables");
    
    // Fallback to the mock Google login for development if credentials aren't available
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
          
          // Create demo tasks for the new user
          await createDemoTasks(user.id);
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
  }

  // Auth middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Google OAuth routes
  app.get("/api/auth/google/login", passport.authenticate("google"));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { 
      failureRedirect: "/login",
      successRedirect: "/"
    })
  );

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
