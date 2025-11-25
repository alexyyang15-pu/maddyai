import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  warmthScore: integer("warmth_score").default(0).notNull(),
  priorityScore: integer("priority_score").default(0).notNull(),
  lastInteraction: timestamp("last_interaction"),
  nextFollowUp: timestamp("next_follow_up"),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  // New fields
  category: text("category"), // Investor, Founder, Advisor, Collaborator
  industry: text("industry"), // HealthTech, AI/ML, etc
  interests: text("interests").array().default([]),
  expertise: text("expertise").array().default([]),
});

export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // For future multi-user support
  firstName: text("first_name"),
  lastName: text("last_name"),
  headline: text("headline"),
  summary: text("summary"),
  currentCompany: text("current_company"),
  currentRole: text("current_role"),
  industries: text("industries").array().default([]),
  skills: text("skills").array().default([]),
  workHistory: text("work_history"), // JSON string of positions array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nudges = pgTable("nudges", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  type: text("type").notNull(), // 'decay' | 'milestone' | 'location' | 'intro'
  message: text("message").notNull(),
  priority: text("priority").notNull(), // 'high' | 'medium' | 'low'
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").default('pending').notNull(), // 'pending' | 'dismissed' | 'completed'
});

export const insertContactSchema = createInsertSchema(contacts).omit({ id: true });
export const insertNudgeSchema = createInsertSchema(nudges).omit({ id: true });
export const insertUserProfileSchema = createInsertSchema(userProfile).omit({ id: true, createdAt: true, updatedAt: true });

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Nudge = typeof nudges.$inferSelect;
export type InsertNudge = z.infer<typeof insertNudgeSchema>;
export type UserProfile = typeof userProfile.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
