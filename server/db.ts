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
        "email" TEXT NOT NULL UNIQUE,
        "display_name" TEXT,
        "photo_url" TEXT,
        "google_id" TEXT UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "due_date" TEXT NOT NULL,
        "category" TEXT,
        "user_id" INTEGER NOT NULL
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
    
    // Demo tasks for new users
    await db.insert(schema.tasks).values([
      {
        title: "Set up development environment",
        description: "Install required tools and dependencies for AI development",
        dueDate: today.toISOString().split('T')[0],
        priority: "high",
        completed: false,
        category: "Infrastructure",
        userId: userId
      },
      {
        title: "Review machine learning concepts",
        description: "Study neural networks, supervised learning, and classification algorithms",
        dueDate: tomorrow.toISOString().split('T')[0],
        priority: "medium",
        completed: false,
        category: "ML Fundamentals",
        userId: userId
      },
      {
        title: "Explore NLP techniques",
        description: "Learn about text preprocessing, tokenization, and embedding techniques",
        dueDate: nextWeek.toISOString().split('T')[0],
        priority: "low",
        completed: false,
        category: "NLP",
        userId: userId
      },
      {
        title: "Install Python and necessary libraries",
        description: "Set up virtual environment with TensorFlow and PyTorch",
        dueDate: today.toISOString().split('T')[0],
        priority: "medium",
        completed: true,
        category: "Programming",
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