import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Create a PostgreSQL connection pool optimized for autoscaling environments
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500, // Close and replace a connection after it has been used 7500 times
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Function to initialize the database tables
export async function initializeDatabase() {
  try {
    // Check if tables exist, if not create them
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT,
        "password_hash" TEXT,
        "email" TEXT NOT NULL UNIQUE,
        "display_name" TEXT,
        "photo_url" TEXT,
        "google_id" TEXT UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "content_link" TEXT,
        "content_type" TEXT,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "due_date" TEXT NOT NULL,
        "category" TEXT,
        "user_id" INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "user_categories" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "user_id" INTEGER NOT NULL,
        UNIQUE("name", "user_id")
      );
    `);
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Function to create demo tasks for a new user
export async function createDemoTasks(userId: number) {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Demo tasks for new users (one per global category)
    await db.insert(schema.tasks).values([
      {
        title: "Automate workflow with n8n",
        description: "Learn how to create your first automation workflow using n8n",
        dueDate: today.toISOString().split('T')[0],
        priority: "high",
        completed: false,
        category: "n8n",
        contentLink: "https://docs.n8n.io/workflows/",
        contentType: "website",
        userId: userId
      },
      {
        title: "Build Zapier integration",
        description: "Connect your application with Zapier to automate tasks across platforms",
        dueDate: tomorrow.toISOString().split('T')[0],
        priority: "medium",
        completed: false,
        category: "zapier",
        contentLink: "https://www.youtube.com/watch?v=PQvAM-M1fFs",
        contentType: "video",
        userId: userId
      },
      {
        title: "Create scenario in Make.com",
        description: "Design your first automation scenario using Make.com's visual builder",
        dueDate: nextWeek.toISOString().split('T')[0],
        priority: "low",
        completed: false,
        category: "make.com",
        contentLink: "https://www.make.com/en/help/scenarios/creating-a-scenario",
        contentType: "website",
        userId: userId
      },
      {
        title: "Complete MCP certification path",
        description: "Start the Microsoft Certified Professional learning path for Azure AI",
        dueDate: today.toISOString().split('T')[0],
        priority: "medium",
        completed: false,
        category: "mcp",
        contentLink: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-engineer/",
        contentType: "website",
        userId: userId
      },
      {
        title: "Deploy first app on Replit",
        description: "Create and deploy a full-stack application on Replit",
        dueDate: tomorrow.toISOString().split('T')[0],
        priority: "high",
        completed: true,
        category: "replit",
        contentLink: "https://www.youtube.com/watch?v=OJUyoKdIKzc",
        contentType: "video",
        userId: userId
      },
      {
        title: "Implement Lovable UI patterns",
        description: "Apply lovable user interface design principles to your current project",
        dueDate: nextWeek.toISOString().split('T')[0],
        priority: "medium",
        completed: false,
        category: "lovable",
        contentLink: "https://www.nngroup.com/articles/ten-usability-heuristics/",
        contentType: "website",
        userId: userId
      },
      {
        title: "Setup Windsurf development environment",
        description: "Install and configure Windsurf framework for your next project",
        dueDate: today.toISOString().split('T')[0],
        priority: "low",
        completed: false,
        category: "windsurf",
        contentLink: "https://windsurf.io/docs/getting-started",
        contentType: "website",
        userId: userId
      },
      {
        title: "Review AI Fundamentals course",
        description: "Complete the introductory course on AI concepts and applications",
        dueDate: tomorrow.toISOString().split('T')[0],
        priority: "high",
        completed: false,
        category: "fundamentals",
        contentLink: "https://www.coursera.org/learn/ai-for-everyone",
        contentType: "website",
        userId: userId
      },
      {
        title: "Explore Entertainment AI innovations",
        description: "Research the latest applications of AI in entertainment and creative industries",
        dueDate: nextWeek.toISOString().split('T')[0],
        priority: "medium",
        completed: false,
        category: "enterteinment-ai",
        contentLink: "https://www.youtube.com/watch?v=QPO-LOZlzxE",
        contentType: "video",
        userId: userId
      }
    ]);
    
    console.log(`Demo tasks created for user ID: ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to create demo tasks:', error);
    return false;
  }
}

// Function to initialize the session table for PostgreSQL session store
export async function initializeSessionTable() {
  try {
    // First check if the session table already exists
    const checkTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'session'
      );
    `);
    
    // Only create the table if it doesn't exist
    if (!checkTableExists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );
        
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
      `);
      console.log('Session table created successfully');
    } else {
      console.log('Session table already exists, skipping creation');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize session table:', error);
    return false;
  }
}

// Function to initialize the user_sessions table for PostgreSQL session store
export async function initializeUserSessionsTable() {
  try {
    // First check if the user_sessions table already exists
    const checkTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_sessions'
      );
    `);
    
    // Only create the table if it doesn't exist
    if (!checkTableExists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "user_sessions" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
        );
        
        CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
      `);
      console.log('User sessions table created successfully');
    } else {
      console.log('User sessions table already exists, skipping creation');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize user sessions table:', error);
    return false;
  }
}