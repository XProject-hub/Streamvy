import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Users table with premium fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Premium fields
  isPremium: boolean("is_premium").default(false).notNull(),
  premiumPlan: text("premium_plan"),
  premiumExpiry: timestamp("premium_expiry"),
  // Stripe fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Payment status and currency enums
export const cryptoPaymentStatusEnum = pgEnum('crypto_payment_status', ['pending', 'completed', 'failed', 'expired']);
export const cryptoCurrencyEnum = pgEnum('crypto_currency', ['BTC', 'USDT', 'LTC']);

// Cryptocurrency payment table
export const cryptoPayments = pgTable("crypto_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planName: text("plan_name").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: cryptoCurrencyEnum("currency").notNull(),
  walletAddress: text("wallet_address").notNull(),
  referenceId: text("reference_id").notNull(),
  status: cryptoPaymentStatusEnum("status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  transactionId: text("transaction_id"),
});

export const insertCryptoPaymentSchema = createInsertSchema(cryptoPayments).pick({
  userId: true,
  planName: true,
  amount: true,
  currency: true,
  walletAddress: true,
  referenceId: true,
  status: true,
  expiresAt: true,
  transactionId: true,
});

// These type definitions will be consolidated at the end of the file

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
  status: text("status").default("unknown").notNull(), // 'online', 'offline', 'unknown'
  lastChecked: timestamp("last_checked"),
  isPremium: boolean("is_premium").default(false).notNull(), // Indicates if channel requires premium subscription
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  logo: true,
  categoryId: true,
  countryId: true,
  epgId: true,
  streamSources: true,
  status: true,
  lastChecked: true,
  isPremium: true,
});

// EPG Programs - shows or events scheduled on channels
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  description: text("description"),
  category: text("category"), // e.g., "Sports", "News", "Movie", "Series"
  posterUrl: text("poster_url"), // Optional image for the program
  episodeTitle: text("episode_title"), // For series episodes
  season: integer("season"), // Season number for series
  episode: integer("episode"), // Episode number for series
  year: integer("year"), // Year of production
  directors: jsonb("directors").default('[]'), // Array of director names
  castMembers: jsonb("cast_members").default('[]'), // Array of cast member names
  rating: text("rating"), // Content rating (e.g., "TV-MA", "PG-13")
  isFeatured: boolean("is_featured").default(false), // Highlight special programs
  externalId: text("external_id"), // ID from EPG source
});

export const insertProgramSchema = createInsertSchema(programs).pick({
  channelId: true,
  title: true,
  startTime: true,
  endTime: true,
  description: true,
  category: true,
  posterUrl: true,
  episodeTitle: true,
  season: true,
  episode: true,
  year: true,
  directors: true,
  castMembers: true,
  rating: true,
  isFeatured: true,
  externalId: true,
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
  countryId: integer("country_id").references(() => countries.id),
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
  countryId: true,
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
  countryId: integer("country_id").references(() => countries.id),
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
  countryId: true,
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
  // New properties for adaptive streaming
  resolution?: string; // e.g., '1080p', '720p', '480p', '360p'
  bandwidth?: number; // in kbps
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
  description: true,
  lastUpdate: true,
  channelCount: true
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

// Site Settings - global configuration options for the streaming platform
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("siteName").default("Streamvy").notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: text("primaryColor").default("#3b82f6").notNull(),
  enableSubscriptions: boolean("enableSubscriptions").default(true).notNull(),
  enablePPV: boolean("enablePPV").default(false).notNull(),
  enableRegistration: boolean("enableRegistration").default(true).notNull(),
  defaultUserQuota: integer("defaultUserQuota").default(5).notNull(), 
  defaultUserConcurrentStreams: integer("defaultUserConcurrentStreams").default(2).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).pick({
  siteName: true,
  logoUrl: true,
  primaryColor: true,
  enableSubscriptions: true,
  enablePPV: true,
  enableRegistration: true,
  defaultUserQuota: true,
  defaultUserConcurrentStreams: true,
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;

// EPG Channel Mapping - maps external EPG channel identifiers to our internal channels
export const epgChannelMappings = pgTable("epg_channel_mappings", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  epgSourceId: integer("epg_source_id").references(() => epgSources.id).notNull(),
  externalChannelId: text("external_channel_id").notNull(), // ID used in the EPG source
  externalChannelName: text("external_channel_name").notNull(), // Name in the EPG source
  isActive: boolean("is_active").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertEPGChannelMappingSchema = createInsertSchema(epgChannelMappings).pick({
  channelId: true,
  epgSourceId: true,
  externalChannelId: true,
  externalChannelName: true,
  isActive: true,
});

export type EPGChannelMapping = typeof epgChannelMappings.$inferSelect;
export type InsertEPGChannelMapping = z.infer<typeof insertEPGChannelMappingSchema>;

// EPG Import Jobs - tracks the status of EPG data imports
export const epgImportJobs = pgTable("epg_import_jobs", {
  id: serial("id").primaryKey(),
  epgSourceId: integer("epg_source_id").references(() => epgSources.id).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  status: text("status").default("pending").notNull(), // 'pending', 'processing', 'completed', 'failed'
  programsImported: integer("programs_imported").default(0),
  channelsImported: integer("channels_imported").default(0),
  errors: jsonb("errors").default('[]'), // Array of error messages
  logDetails: text("log_details"), // Detailed log information
});

export const insertEPGImportJobSchema = createInsertSchema(epgImportJobs).pick({
  epgSourceId: true,
  startTime: true,
  endTime: true,
  status: true,
  programsImported: true,
  channelsImported: true,
  errors: true,
  logDetails: true,
});

export type EPGImportJob = typeof epgImportJobs.$inferSelect;
export type InsertEPGImportJob = z.infer<typeof insertEPGImportJobSchema>;

// Extend users table with premium fields
// Extended users for premium features - adds columns to the users table
export const extendedUsers = pgTable("users", {
  id: serial("id").primaryKey(),  // Required for updates, matching the primary key of users
  isPremium: boolean("is_premium").default(false),
  premiumPlan: text("premium_plan"),
  premiumExpiry: timestamp("premium_expiry"),
});

// We already defined crypto payment tables above, so this section is removed
// to avoid duplicate declarations

// Crypto Wallet Addresses - tracks available wallet addresses for payments
export const cryptoWalletAddresses = pgTable("crypto_wallet_addresses", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  currency: cryptoCurrencyEnum("currency").notNull(),
  label: text("label"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCryptoWalletAddressSchema = createInsertSchema(cryptoWalletAddresses).pick({
  address: true,
  currency: true,
  label: true,
  isActive: true,
});

export type CryptoWalletAddress = typeof cryptoWalletAddresses.$inferSelect;
export type InsertCryptoWalletAddress = z.infer<typeof insertCryptoWalletAddressSchema>;

// Stream Analytics - Advanced analytics for detailed streaming metrics and health monitoring
export const streamAnalytics = pgTable("stream_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contentType: text("content_type").notNull(), // 'movie', 'episode', 'channel'
  contentId: integer("content_id").notNull(),
  event: text("event").notNull(), // 'start', 'end', 'error', 'buffering', 'quality_change'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  duration: integer("duration"), // in seconds, useful for calculating total watch time
  quality: text("quality"), // e.g., '1080p', '720p', '480p', 'auto'
  bandwidth: integer("bandwidth"), // in Kbps
  location: text("location"), // Country or region code (for geo-analytics)
  ipAddress: text("ip_address"), // Anonymized IP for geographical analysis
  userAgent: text("user_agent"), // Device/browser information
  error: text("error"), // Error details if event is 'error'
  bufferingDuration: integer("buffering_duration"), // in milliseconds, for 'buffering' events
  customData: jsonb("custom_data").default('{}'), // For additional metrics
});

export const insertStreamAnalyticsSchema = createInsertSchema(streamAnalytics).pick({
  userId: true,
  contentType: true,
  contentId: true,
  event: true,
  timestamp: true,
  duration: true,
  quality: true,
  bandwidth: true,
  location: true,
  ipAddress: true,
  userAgent: true,
  error: true,
  bufferingDuration: true,
  customData: true,
});

export type StreamAnalytics = typeof streamAnalytics.$inferSelect;
export type InsertStreamAnalytics = z.infer<typeof insertStreamAnalyticsSchema>;

// Geographic Restrictions table
export const geoRestrictions = pgTable("geo_restrictions", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(), // 'movie', 'episode', 'series', 'channel'
  contentId: integer("content_id").notNull(),
  restrictionType: text("restriction_type").notNull(), // 'whitelist' or 'blacklist'
  countryCodes: jsonb("country_codes").notNull(), // Array of country codes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGeoRestrictionSchema = createInsertSchema(geoRestrictions).pick({
  contentType: true,
  contentId: true,
  restrictionType: true,
  countryCodes: true,
});

export type GeoRestriction = typeof geoRestrictions.$inferSelect;
export type InsertGeoRestriction = z.infer<typeof insertGeoRestrictionSchema>;

// Active Stream Tokens table - for token rotation and concurrent stream limiting
export const activeStreamTokens = pgTable("active_stream_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tokenId: text("token_id").notNull().unique(),
  contentType: text("content_type").notNull(), // 'movie', 'episode', 'channel'
  contentId: integer("content_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastRotatedAt: timestamp("last_rotated_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isRevoked: boolean("is_revoked").default(false).notNull(),
});

export const insertActiveStreamTokenSchema = createInsertSchema(activeStreamTokens).pick({
  userId: true,
  tokenId: true,
  contentType: true,
  contentId: true,
  expiresAt: true,
  ipAddress: true,
  userAgent: true,
});

export type ActiveStreamToken = typeof activeStreamTokens.$inferSelect;
export type InsertActiveStreamToken = z.infer<typeof insertActiveStreamTokenSchema>;

// PPV Content - tracks individual pay-per-view purchases
export const ppvPurchases = pgTable("ppv_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(), // 'movie', 'series', 'episode', 'event'
  contentId: integer("content_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: cryptoCurrencyEnum("currency").notNull(),
  status: cryptoPaymentStatusEnum("status").default('pending').notNull(),
  paymentId: integer("payment_id").references(() => cryptoPayments.id),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // When the PPV access expires
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertPPVPurchaseSchema = createInsertSchema(ppvPurchases).pick({
  userId: true,
  contentType: true,
  contentId: true,
  amount: true,
  currency: true,
  status: true,
  paymentId: true,
  expiresAt: true,
  isActive: true,
});

export type PPVPurchase = typeof ppvPurchases.$inferSelect;
export type InsertPPVPurchase = z.infer<typeof insertPPVPurchaseSchema>;

// Export crypto payment types
export type CryptoPayment = typeof cryptoPayments.$inferSelect;
export type InsertCryptoPayment = z.infer<typeof insertCryptoPaymentSchema>;
