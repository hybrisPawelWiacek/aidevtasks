import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { insertTaskSchema, taskValidationSchema, loginUserSchema, registerUserSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import pgSession from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PostgresStorage } from "./pg-storage";
import { 
  initializeDatabase, 
  createDemoTasks, 
  db, 
  pool, 
  initializeUserSessionsTable 
} from "./db";

// Initialize environment variables
dotenv.config();

// Production configuration
const isProduction = process.env.NODE_ENV === "production";
const SESSION_SECRET = process.env.SESSION_SECRET || "ai-dev-tasks-secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";
const DOMAIN = process.env.DOMAIN || "localhost";

// Initialize storage
const storage = new PostgresStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database and session tables
  await initializeDatabase();
  await initializeUserSessionsTable();

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all API routes
  app.use("/api", apiLimiter);

  // Configure session
  const PostgresStore = pgSession(session);
  
  // Create a more resilient session store configuration
  let sessionStore;
  try {
    sessionStore = new PostgresStore({
      pool,
      tableName: 'user_sessions',
      // Don't attempt to create the table automatically to avoid constraint errors
      createTableIfMissing: false 
    });
  } catch (error) {
    console.error("Error initializing session store:", error);
    // Fallback to memory store for development if postgres store fails
    const MemoryStore = session.MemoryStore;
    sessionStore = new MemoryStore();
  }
  
  app.use(
    session({
      store: sessionStore,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: isProduction, 
        maxAge: 86400000, // 1 day
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? DOMAIN : undefined
      }
    })
  );

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

  // Local auth strategy
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        // User exists, check password
        if (!user.password_hash) {
          console.log("No password hash found for user:", user.email);
          return done(null, false, { message: "This account doesn't have a password set" });
        }
        
        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Error in local strategy:", error);
        return done(error as Error);
      }
    }
  ));
  
  // Email/password login route
  app.post("/api/auth/login", (req, res, next) => {
    try {
      // Validate login data
      const loginData = loginUserSchema.parse(req.body);
      
      passport.authenticate('local', (err: Error, user: any, info: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Server error during login" });
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid email or password" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.status(500).json({ message: "Error during login" });
          }
          
          return res.status(200).json({ user });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error during login" });
    }
  });
  
  // User registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate registration data
      const registerData = registerUserSchema.parse(req.body);
      
      // Check if passwords match
      if (registerData.password !== registerData.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(registerData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(registerData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(registerData.password, salt);
      
      // Create user
      const user = await storage.createUser({
        email: registerData.email,
        username: registerData.username,
        displayName: registerData.displayName,
        password_hash: passwordHash
      });
      
      // Create demo tasks for new user
      await createDemoTasks(user.id);
      
      // Log user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login after registration error:", err);
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(200).json({ user });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Server error during registration" });
    }
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
