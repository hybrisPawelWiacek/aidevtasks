
import { db, pool } from './db';
import { users, tasks } from '@shared/schema';

async function viewDatabaseData() {
  console.log('Querying database for current data...');
  
  try {
    // Query all users (excluding password hashes for security)
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName
    }).from(users);
    
    console.log('\n===== USERS =====');
    console.log(JSON.stringify(allUsers, null, 2));
    console.log(`Total users: ${allUsers.length}`);
    
    // Query all tasks
    const allTasks = await db.select().from(tasks);
    console.log('\n===== TASKS =====');
    console.log(JSON.stringify(allTasks, null, 2));
    console.log(`Total tasks: ${allTasks.length}`);
    
    // Show tasks by user
    console.log('\n===== TASKS BY USER =====');
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
    
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the query
viewDatabaseData().catch(console.error);
