
import { initializeDatabase, initializeSessionTable, initializeUserSessionsTable, pool } from './db';

async function reinitializeDb() {
  console.log('Starting database reinitialization...');
  
  try {
    // Initialize database tables
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      console.log('✅ Database tables initialized successfully');
    } else {
      console.error('❌ Failed to initialize database tables');
    }
    
    // Initialize session tables
    const sessionTableInitialized = await initializeSessionTable();
    if (sessionTableInitialized) {
      console.log('✅ Session table initialized successfully');
    } else {
      console.error('❌ Failed to initialize session table');
    }
    
    const userSessionsTableInitialized = await initializeUserSessionsTable();
    if (userSessionsTableInitialized) {
      console.log('✅ User sessions table initialized successfully');
    } else {
      console.error('❌ Failed to initialize user sessions table');
    }
    
    console.log('Database reinitialization complete!');
  } catch (error) {
    console.error('Error during database reinitialization:', error);
  } finally {
    // Close the database connection pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the reinitialization
reinitializeDb().catch(console.error);
