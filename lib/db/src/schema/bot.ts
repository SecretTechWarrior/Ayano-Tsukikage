import { pgTable, serial, text, integer, boolean, timestamp, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const authorizedUsersTable = pgTable("authorized_users", {
  id: serial("id").primaryKey(),
  telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  addedBy: bigint("added_by", { mode: "number" }).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  nickname: text("nickname"),
});

export const insertAuthorizedUserSchema = createInsertSchema(authorizedUsersTable).omit({ id: true, addedAt: true });
export type InsertAuthorizedUser = z.infer<typeof insertAuthorizedUserSchema>;
export type AuthorizedUser = typeof authorizedUsersTable.$inferSelect;

export const chatMemoryTable = pgTable("chat_memory", {
  id: serial("id").primaryKey(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  messageId: integer("message_id"),
});

export const insertChatMemorySchema = createInsertSchema(chatMemoryTable).omit({ id: true, timestamp: true });
export type InsertChatMemory = z.infer<typeof insertChatMemorySchema>;
export type ChatMemory = typeof chatMemoryTable.$inferSelect;

export const todosTable = pgTable("todos", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  text: text("text").notNull(),
  done: boolean("done").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTodoSchema = createInsertSchema(todosTable).omit({ id: true, createdAt: true });
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todosTable.$inferSelect;

export const notesTable = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notesTable.$inferSelect;

export const remindersTable = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  text: text("text").notNull(),
  remindAt: timestamp("remind_at").notNull(),
  sent: boolean("sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReminderSchema = createInsertSchema(remindersTable).omit({ id: true, createdAt: true });
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof remindersTable.$inferSelect;

export const botMessagesTable = pgTable("bot_messages", {
  id: serial("id").primaryKey(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  chatTitle: text("chat_title"),
  userId: bigint("user_id", { mode: "number" }),
  username: text("username"),
  messageText: text("message_text"),
  messageType: text("message_type").notNull().default("text"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isFromBot: boolean("is_from_bot").default(false).notNull(),
});

export const insertBotMessageSchema = createInsertSchema(botMessagesTable).omit({ id: true, timestamp: true });
export type InsertBotMessage = z.infer<typeof insertBotMessageSchema>;
export type BotMessage = typeof botMessagesTable.$inferSelect;
