
import { db, pool } from './db';
import { users, tasks } from '@shared/schema';
import readline from 'readline';

// Create readline interface to handle prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Override readline question to automatically answer "yes"
rl.question = (query, callback) => {
  console.log(query);
  console.log("Automatically answering: yes");
  callback("yes");
};

async function queryDatabase() {
  console.log("Querying database for users and tasks...");
  
  try {
    // Query all users
    const allUsers = await db.select().from(users);
    console.log("\n===== USERS =====");
    console.log(JSON.stringify(allUsers, null, 2));
    console.log(`Total users: ${allUsers.length}`);
    
    // Query all tasks
    const allTasks = await db.select().from(tasks);
    console.log("\n===== TASKS =====");
    console.log(JSON.stringify(allTasks, null, 2));
    console.log(`Total tasks: ${allTasks.length}`);
    
    // Query tasks grouped by user
    console.log("\n===== TASKS BY USER =====");
    for (const user of allUsers) {
      const userTasks = allTasks.filter(task => task.userId === user.id);
      console.log(`\nUser: ${user.username} (ID: ${user.id})`);
      console.log(`Email: ${user.email}`);
      console.log(`Tasks: ${userTasks.length}`);
      
      if (userTasks.length > 0) {
        console.log("Task list:");
        userTasks.forEach((task, index) => {
          console.log(`  ${index + 1}. ${task.title} (${task.completed ? 'Completed' : 'Pending'}) - Priority: ${task.priority}, Due: ${task.dueDate}`);
        });
      }
    }
    
    // Ask if user wants to see password hashes (will automatically answer yes)
    await new Promise<void>((resolve) => {
      rl.question("Do you want to see password hashes? (yes/no) ", (answer) => {
        if (answer.toLowerCase() === 'yes') {
          console.log("\n===== USER PASSWORDS =====");
          allUsers.forEach(user => {
            console.log(`User: ${user.username} | Password Hash: ${user.password || '[None]'}`);
          });
        }
        resolve();
      });
    });
    
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    // Close the readline interface
    rl.close();
    // Close the connection pool
    await pool.end();
  }
}

// Run the query
queryDatabase().catch(console.error);
