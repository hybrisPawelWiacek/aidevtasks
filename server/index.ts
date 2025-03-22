// Import our warning wrapper first to suppress TimeoutOverflowWarning
import "./wrap-warnings";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { initializeDatabase } from "./db";

// Load environment variables
dotenv.config();

const app = express();
// Trust proxy headers for running behind Replit's proxy
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware
app.use((req, res, next) => {
  // Check if in production mode
  const isProduction = process.env.REPLIT_ENVIRONMENT === "production" || process.env.NODE_ENV === "production";
  
  if (isProduction) {
    console.log("Adding CORS headers for production environment");
    const allowedOrigins = ['https://todo.agenticforce.io'];
    const origin = req.headers.origin || 'https://todo.agenticforce.io';
    
    // Production CORS headers
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    
    // Log headers for debugging
    console.log("Production CORS headers set:", {
      origin,
      method: req.method,
      path: req.path,
      hasCredentials: !!req.headers.cookie
    });
  } else {
    // Development CORS headers - more permissive
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    console.log("Development CORS headers set:", {
      origin,
      method: req.method,
      path: req.path
    });
  }
  
  // Handle preflight requests for both environments
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize the database connection
    log("Initializing database...");
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      log("Failed to initialize database, proceeding with caution");
    } else {
      log("Database initialized successfully");
    }
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Server error:", err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      try {
        serveStatic(app);
      } catch (error) {
        console.warn("Failed to serve static files:", error);
        console.log("Falling back to development mode...");
        await setupVite(app, server);
      }
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
