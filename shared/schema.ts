import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  iconSvg: text("icon_svg"),
  gradientFrom: text("gradient_from"),
  gradientTo: text("gradient_to"),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  iconSvg: true,
  gradientFrom: true,
  gradientTo: true,
});

// Countries table
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  flag: text("flag"),
});

export const insertCountrySchema = createInsertSchema(countries).pick({
  name: true,
  code: true,
  flag: true,
});

// Channels table
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  categoryId: integer("category_id").references(() => categories.id),
  countryId: integer("country_id").references(() => countries.id),
  epgId: text("epg_id"),
  streamSources: jsonb("stream_sources").notNull(), // Array of URLs with priority
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  logo: true,
  categoryId: true,
  countryId: true,
  epgId: true,
  streamSources: true,
});

// Current program on each channel
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  description: text("description"),
});

export const insertProgramSchema = createInsertSchema(programs).pick({
  channelId: true,
  title: true,
  startTime: true,
  endTime: true,
  description: true,
});

// Movies table
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  poster: text("poster"),
  year: integer("year"),
  rating: text("rating"),
  duration: integer("duration"), // in minutes
  categoryId: integer("category_id").references(() => categories.id),
  streamSources: jsonb("stream_sources").notNull(), // Array of URLs with priority
  isPremium: boolean("is_premium").default(false).notNull(),
});

export const insertMovieSchema = createInsertSchema(movies).pick({
  title: true,
  poster: true,
  year: true,
  rating: true,
  duration: true,
  categoryId: true,
  streamSources: true,
  isPremium: true,
});

// Series table
export const series = pgTable("series", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  poster: text("poster"),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  rating: text("rating"),
  categoryId: integer("category_id").references(() => categories.id),
  seasons: integer("seasons").default(1).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
});

export const insertSeriesSchema = createInsertSchema(series).pick({
  title: true,
  poster: true,
  startYear: true,
  endYear: true,
  rating: true,
  categoryId: true,
  seasons: true,
  isPremium: true,
});

// Episodes table for series
export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  season: integer("season").notNull(),
  episode: integer("episode").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration"), // in minutes
  streamSources: jsonb("stream_sources").notNull(), // Array of URLs with priority
});

export const insertEpisodeSchema = createInsertSchema(episodes).pick({
  seriesId: true,
  season: true,
  episode: true,
  title: true,
  description: true,
  duration: true,
  streamSources: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;

export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export type Movie = typeof movies.$inferSelect;
export type InsertMovie = z.infer<typeof insertMovieSchema>;

export type Series = typeof series.$inferSelect;
export type InsertSeries = z.infer<typeof insertSeriesSchema>;

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;

// Define stream source type for consistency
export type StreamSource = {
  url: string;
  priority: number;
  format: string; // 'hls', 'mp4', etc.
  label?: string;
};

// EPG Source
export const epgSources = pgTable("epg_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  lastUpdate: timestamp("last_update").defaultNow(),
  channelCount: integer("channel_count").default(0)
});

export const insertEPGSourceSchema = createInsertSchema(epgSources).pick({
  name: true,
  url: true,
  description: true
});

export type EPGSource = typeof epgSources.$inferSelect;
export type InsertEPGSource = z.infer<typeof insertEPGSourceSchema>;

// Watch History - to track what users are watching
export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contentType: text("content_type").notNull(), // 'movie', 'episode', 'channel'
  contentId: integer("content_id").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  progress: integer("progress"), // percentage completed (0-100)
  completed: boolean("completed").default(false),
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).pick({
  userId: true,
  contentType: true,
  contentId: true,
  startTime: true,
  endTime: true,
  duration: true,
  progress: true,
  completed: true,
});

export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;

// User Preferences - to store user preferences, including favorites
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  favorites: jsonb("favorites").default('{"movies":[],"series":[],"channels":[]}'),
  preferredCategories: jsonb("preferred_categories").default('[]'),
  contentFilters: jsonb("content_filters").default('{}'),
  uiSettings: jsonb("ui_settings").default('{}'),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  favorites: true,
  preferredCategories: true,
  contentFilters: true,
  uiSettings: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
