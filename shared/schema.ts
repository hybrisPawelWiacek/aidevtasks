import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  password_hash: text("password_hash"),  // Match DB column exactly
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  googleId: text("google_id").unique(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  contentLink: text("content_link"),
  contentType: text("content_type"),
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority").default("medium").notNull(),
  dueDate: text("due_date").notNull(),
  category: text("category"),
  userId: integer("user_id").notNull(),
});

export const userCategories = pgTable("user_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
}, (table) => {
  return {
    // Ensure each user can only have unique category names
    uniqueUserCategory: unique().on(table.name, table.userId)
  };
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

export const insertUserCategorySchema = createInsertSchema(userCategories).omit({
  id: true,
});

// User registration schema with password
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// User login schema
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type PriorityLevel = "low" | "medium" | "high";

export const taskValidationSchema = insertTaskSchema.extend({
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().min(1, "Due date is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertUserCategory = z.infer<typeof insertUserCategorySchema>;
export type UserCategory = typeof userCategories.$inferSelect;
