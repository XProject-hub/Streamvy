import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory,
  countries, Country, InsertCountry,
  channels, Channel, InsertChannel,
  programs, Program, InsertProgram,
  movies, Movie, InsertMovie,
  series, Series, InsertSeries,
  episodes, Episode, InsertEpisode,
  epgSources, EPGSource, InsertEPGSource,
  watchHistory, WatchHistory, InsertWatchHistory,
  userPreferences, UserPreferences, InsertUserPreferences,
  siteSettings, SiteSettings, InsertSiteSettings,
  cryptoPayments, CryptoPayment, InsertCryptoPayment,
  cryptoWalletAddresses, CryptoWalletAddress, InsertCryptoWalletAddress,
  StreamSource,
  // New schema entities
  streamAnalytics, StreamAnalytics, InsertStreamAnalytics,
  geoRestrictions, GeoRestriction, InsertGeoRestriction,
  activeStreamTokens, ActiveStreamToken, InsertActiveStreamToken,
  ppvPurchases, PPVPurchase, InsertPPVPurchase,
  epgChannelMappings, EPGChannelMapping, InsertEPGChannelMapping,
  epgImportJobs, EPGImportJob, InsertEPGImportJob
} from "@shared/schema";
import { and, eq, ne, lte, gte, lt, count, desc, asc, sql } from "drizzle-orm";
import { db, pool } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

// Session stores
const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Define session store type
type SessionStore = session.Store;

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User Preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  toggleFavorite(userId: number, contentType: string, contentId: number): Promise<UserPreferences | undefined>;
  
  // Watch History operations
  getUserWatchHistory(userId: number): Promise<WatchHistory[]>;
  getWatchHistory(id: number): Promise<WatchHistory | undefined>;
  recordWatchEvent(event: InsertWatchHistory): Promise<WatchHistory>;
  updateWatchEvent(id: number, event: Partial<InsertWatchHistory>): Promise<WatchHistory | undefined>;
  getUserWatchStats(userId: number): Promise<any>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Country operations
  getCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;
  updateCountry(id: number, country: Partial<InsertCountry>): Promise<Country | undefined>;
  deleteCountry(id: number): Promise<boolean>;
  
  // Channel operations
  getChannels(): Promise<Channel[]>;
  getChannel(id: number): Promise<Channel | undefined>;
  getChannelsByCategory(categoryId: number): Promise<Channel[]>;
  getChannelsByCountry(countryId: number): Promise<Channel[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: number, channel: Partial<InsertChannel>): Promise<Channel | undefined>;
  deleteChannel(id: number): Promise<boolean>;
  
  // Program operations
  getCurrentPrograms(): Promise<Program[]>;
  getChannelPrograms(channelId: number): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  
  // Movie operations
  getMovies(): Promise<Movie[]>;
  getMovie(id: number): Promise<Movie | undefined>;
  getMoviesByCategory(categoryId: number): Promise<Movie[]>;
  getMoviesByCountry(countryId: number): Promise<Movie[]>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  deleteMovie(id: number): Promise<boolean>;
  
  // Series operations
  getAllSeries(): Promise<Series[]>;
  getSeries(id: number): Promise<Series | undefined>;
  getSeriesByCategory(categoryId: number): Promise<Series[]>;
  getSeriesByCountry(countryId: number): Promise<Series[]>;
  createSeries(series: InsertSeries): Promise<Series>;
  updateSeries(id: number, series: Partial<InsertSeries>): Promise<Series | undefined>;
  deleteSeries(id: number): Promise<boolean>;
  
  // Episode operations
  getEpisodes(seriesId: number): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, episode: Partial<InsertEpisode>): Promise<Episode | undefined>;
  deleteEpisode(id: number): Promise<boolean>;
  
  // EPG operations
  getEPGSources(): Promise<EPGSource[]>;
  getEPGSource(id: number): Promise<EPGSource | undefined>;
  createEPGSource(source: InsertEPGSource): Promise<EPGSource>;
  updateEPGSource(id: number, source: Partial<InsertEPGSource>): Promise<EPGSource | undefined>;
  deleteEPGSource(id: number): Promise<boolean>;
  refreshEPGSource(id: number): Promise<EPGSource | undefined>;
  
  // EPG Channel Mappings
  getEPGChannelMappings(epgSourceId?: number): Promise<EPGChannelMapping[]>;
  getEPGChannelMapping(id: number): Promise<EPGChannelMapping | undefined>;
  getChannelEPGMapping(channelId: number, epgSourceId: number): Promise<EPGChannelMapping | undefined>;
  createEPGChannelMapping(mapping: InsertEPGChannelMapping): Promise<EPGChannelMapping>;
  updateEPGChannelMapping(id: number, mapping: Partial<InsertEPGChannelMapping>): Promise<EPGChannelMapping | undefined>;
  deleteEPGChannelMapping(id: number): Promise<boolean>;
  
  // EPG Import Jobs
  getEPGImportJobs(epgSourceId?: number): Promise<EPGImportJob[]>;
  getEPGImportJob(id: number): Promise<EPGImportJob | undefined>;
  createEPGImportJob(job: InsertEPGImportJob): Promise<EPGImportJob>;
  updateEPGImportJob(id: number, job: Partial<InsertEPGImportJob>): Promise<EPGImportJob | undefined>;
  deleteEPGImportJob(id: number): Promise<boolean>;
  

  
  // Site Settings operations
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings>;
  
  // Crypto Payment operations
  getCryptoPayment(id: number): Promise<CryptoPayment | undefined>;
  getCryptoPaymentsByUserId(userId: number): Promise<CryptoPayment[]>;
  createCryptoPayment(payment: InsertCryptoPayment): Promise<CryptoPayment>;
  updateCryptoPayment(id: number, payment: Partial<CryptoPayment>): Promise<CryptoPayment | undefined>;
  getPendingCryptoPayments(): Promise<CryptoPayment[]>;
  
  // User subscription operations
  updateUserSubscription(userId: number, subscription: { isPremium: boolean; premiumTier?: string; premiumExpiresAt?: Date }): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User>;
  checkUserPremiumStatus(userId: number): Promise<{ isPremium: boolean; planName: string | null; expiryDate: Date | null }>;
  
  // Premium content operations
  getPremiumMovies(): Promise<Movie[]>;
  getPremiumSeries(): Promise<Series[]>;
  getPremiumChannels(): Promise<Channel[]>;
  
  // PPV operations
  createPPVPurchase(purchase: InsertPPVPurchase): Promise<PPVPurchase>;
  getPPVPurchaseById(id: number): Promise<PPVPurchase | undefined>;
  getPPVPurchasesByUserId(userId: number): Promise<PPVPurchase[]>;
  getUserPPVForContent(userId: number, contentType: string, contentId: number): Promise<PPVPurchase | undefined>;
  updatePPVPurchaseStatus(id: number, status: string): Promise<PPVPurchase | undefined>;
  deactivatePPVPurchase(id: number): Promise<PPVPurchase | undefined>;
  getActivePPVPurchases(): Promise<PPVPurchase[]>;
  
  // Stream Analytics operations
  recordStreamAnalytics(analytics: InsertStreamAnalytics): Promise<StreamAnalytics>;
  getStreamAnalytics(userId?: number, contentType?: string, contentId?: number): Promise<StreamAnalytics[]>;
  getStreamAnalyticsByEvent(event: string): Promise<StreamAnalytics[]>;
  getLatestStreamEvent(userId: number, contentType: string, contentId: number, event: string): Promise<StreamAnalytics | undefined>;
  getStreamQualityStats(userId?: number): Promise<{ quality: string; count: number }[]>;
  getStreamBufferingStats(userId?: number, days?: number): Promise<{ date: string; avgBufferingMs: number; count: number }[]>;
  
  // Stream Token operations
  createActiveStreamToken(token: InsertActiveStreamToken): Promise<ActiveStreamToken>;
  getActiveStreamToken(tokenId: string): Promise<ActiveStreamToken | undefined>;
  revokeStreamToken(tokenId: string): Promise<boolean>;
  rotateStreamToken(tokenId: string, newTokenId: string): Promise<ActiveStreamToken | undefined>;
  getUserActiveStreamTokens(userId: number): Promise<ActiveStreamToken[]>;
  cleanupExpiredStreamTokens(): Promise<number>;

  // Geographic Restrictions operations
  createGeoRestriction(restriction: InsertGeoRestriction): Promise<GeoRestriction>;
  getGeoRestriction(id: number): Promise<GeoRestriction | undefined>;
  getGeoRestrictionForContent(contentType: string, contentId: number): Promise<GeoRestriction | undefined>;
  updateGeoRestriction(id: number, restriction: Partial<InsertGeoRestriction>): Promise<GeoRestriction | undefined>;
  deleteGeoRestriction(id: number): Promise<boolean>;
  checkGeoRestriction(contentType: string, contentId: number, countryCode: string): Promise<boolean>;
  
  // DRM & encryption operations
  getDRMKeyForContent(contentType: string, contentId: number): Promise<string | null>;
  
  // Session store
  sessionStore: SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  // Storage for each model
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private countries: Map<number, Country>;
  private channels: Map<number, Channel>;
  private programs: Map<number, Program>;
  private movies: Map<number, Movie>;
  private series: Map<number, Series>;
  private episodes: Map<number, Episode>;
  private epgSources: Map<number, EPGSource>;
  private watchHistoryRecords: Map<number, WatchHistory>;
  private userPreferencesRecords: Map<number, UserPreferences>;
  private siteSettingsRecord: SiteSettings | undefined;
  private cryptoPayments: Map<number, CryptoPayment>;
  private cryptoWalletAddresses: Map<number, CryptoWalletAddress>;
  private ppvPurchases: Map<number, PPVPurchase>;
  
  // New storage maps for stream features
  private streamAnalyticsRecords: Map<number, StreamAnalytics>;
  private geoRestrictions: Map<number, GeoRestriction>;
  private activeTokens: Map<string, ActiveStreamToken>;
  private drmKeys: Map<string, string>; // content_type:content_id -> key
  
  // Counters for IDs
  private userCounter: number;
  private categoryCounter: number;
  private countryCounter: number;
  private channelCounter: number;
  private programCounter: number;
  private movieCounter: number;
  private seriesCounter: number;
  private episodeCounter: number;
  private epgSourceCounter: number;
  private watchHistoryCounter: number;
  private userPreferencesCounter: number;
  private cryptoPaymentCounter: number;
  private cryptoWalletAddressCounter: number;
  private ppvPurchaseCounter: number;
  
  // Session store
  public sessionStore: SessionStore;
  
  // Additional counters for new entities
  private streamAnalyticsCounter: number;
  private geoRestrictionCounter: number;
  private tokenCounter: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.countries = new Map();
    this.channels = new Map();
    this.programs = new Map();
    this.movies = new Map();
    this.series = new Map();
    this.episodes = new Map();
    this.epgSources = new Map();
    this.watchHistoryRecords = new Map();
    this.userPreferencesRecords = new Map();
    this.cryptoPayments = new Map();
    this.cryptoWalletAddresses = new Map();
    this.ppvPurchases = new Map();
    
    // Initialize new storage maps
    this.streamAnalyticsRecords = new Map();
    this.geoRestrictions = new Map();
    this.activeTokens = new Map();
    this.drmKeys = new Map();
    
    this.userCounter = 1;
    this.categoryCounter = 1;
    this.countryCounter = 1;
    this.channelCounter = 1;
    this.programCounter = 1;
    this.movieCounter = 1;
    this.seriesCounter = 1;
    this.episodeCounter = 1;
    this.epgSourceCounter = 1;
    this.watchHistoryCounter = 1;
    this.userPreferencesCounter = 1;
    this.cryptoPaymentCounter = 1;
    this.cryptoWalletAddressCounter = 1;
    this.ppvPurchaseCounter = 1;
    
    // Initialize new counters
    this.streamAnalyticsCounter = 1;
    this.geoRestrictionCounter = 1;
    this.tokenCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions once a day
    });
    
    // Initialize with sample data
    this.initializeSampleData();
    
    // Log the admin user
    const adminUser = this.users.get(1);
    console.log("===========================================");
    console.log("Admin user from storage:", adminUser ? {
      id: adminUser.id,
      username: adminUser.username,
      passwordLength: adminUser.password ? adminUser.password.length : 0,
      passwordPreview: adminUser.password ? adminUser.password.substring(0, 20) + "..." : null,
      isAdmin: adminUser.isAdmin,
      createdAt: adminUser.createdAt
    } : "Not found");
    console.log("===========================================");
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false,
      createdAt: now,
      isPremium: insertUser.isPremium ?? false,
      premiumPlan: insertUser.premiumPlan || null,
      premiumExpiry: insertUser.premiumExpiry || null,
      stripeCustomerId: insertUser.stripeCustomerId || null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId || null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryCounter++;
    const newCategory: Category = { 
      ...category, 
      id,
      iconSvg: category.iconSvg ?? null,
      gradientFrom: category.gradientFrom ?? null,
      gradientTo: category.gradientTo ?? null
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryUpdate };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Country operations
  async getCountries(): Promise<Country[]> {
    return Array.from(this.countries.values());
  }
  
  async getCountry(id: number): Promise<Country | undefined> {
    return this.countries.get(id);
  }
  
  async createCountry(country: InsertCountry): Promise<Country> {
    const id = this.countryCounter++;
    const newCountry: Country = { 
      ...country, 
      id,
      flag: country.flag || null 
    };
    this.countries.set(id, newCountry);
    return newCountry;
  }
  
  async updateCountry(id: number, countryUpdate: Partial<InsertCountry>): Promise<Country | undefined> {
    const country = this.countries.get(id);
    if (!country) return undefined;
    
    const updatedCountry: Country = { ...country, ...countryUpdate };
    this.countries.set(id, updatedCountry);
    return updatedCountry;
  }
  
  async deleteCountry(id: number): Promise<boolean> {
    return this.countries.delete(id);
  }
  
  // Channel operations
  async getChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }
  
  async getChannel(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }
  
  async getChannelsByCategory(categoryId: number): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.categoryId === categoryId
    );
  }
  
  async getChannelsByCountry(countryId: number): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.countryId === countryId
    );
  }
  
  async createChannel(channel: InsertChannel): Promise<Channel> {
    const id = this.channelCounter++;
    const newChannel: Channel = { 
      ...channel, 
      id,
      logo: channel.logo ?? null,
      categoryId: channel.categoryId ?? null,
      countryId: channel.countryId ?? null,
      epgId: channel.epgId ?? null,
      status: channel.status ?? 'unknown',
      lastChecked: channel.lastChecked ?? null
    };
    this.channels.set(id, newChannel);
    return newChannel;
  }
  
  async updateChannel(id: number, channelUpdate: Partial<InsertChannel>): Promise<Channel | undefined> {
    const channel = this.channels.get(id);
    if (!channel) return undefined;
    
    const updatedChannel: Channel = { ...channel, ...channelUpdate };
    this.channels.set(id, updatedChannel);
    return updatedChannel;
  }
  
  async deleteChannel(id: number): Promise<boolean> {
    return this.channels.delete(id);
  }
  
  // Program operations
  async getCurrentPrograms(): Promise<Program[]> {
    const now = new Date();
    return Array.from(this.programs.values()).filter(
      (program) => program.startTime <= now && program.endTime >= now
    );
  }
  
  async getChannelPrograms(channelId: number): Promise<Program[]> {
    try {
      // First try to get the channel to check if it has an EPG ID
      const channel = await this.getChannel(channelId);
      
      if (!channel || !channel.epgId) {
        // If no channel or no EPG ID, just return programs directly mapped to this channel
        return Array.from(this.programs.values()).filter(
          (program) => program.channelId === channelId
        );
      }
      
      // If we have an EPG ID, check for mappings
      const directPrograms = Array.from(this.programs.values()).filter(
        (program) => program.channelId === channelId
      );
      
      if (directPrograms.length > 0) {
        console.log(`Found ${directPrograms.length} programs for channel ${channelId} with direct mapping`);
        return directPrograms;
      }
      
      // If no directly mapped programs, look for EPG channel mappings
      console.log(`Checking EPG mappings for channel ${channelId} with EPG ID ${channel.epgId}`);
      
      // Get all mappings for this channel across all EPG sources
      const mappings = Array.from(this.epgChannelMappings.values()).filter(
        (mapping) => mapping.channelId === channelId
      );
      
      if (mappings.length === 0) {
        console.log(`No EPG mappings found for channel ${channelId}`);
        return [];
      }
      
      // For each mapping, get the programs that match the externalChannelId
      const allPrograms: Program[] = [];
      
      for (const mapping of mappings) {
        console.log(`Checking programs for mapping: Channel ${channelId} -> External ID ${mapping.externalChannelId}`);
        
        // Get all programs where the externalId matches the mapping's externalChannelId
        const mappedPrograms = Array.from(this.programs.values()).filter(
          (program) => program.externalId === mapping.externalChannelId
        );
        
        console.log(`Found ${mappedPrograms.length} programs for external ID ${mapping.externalChannelId}`);
        
        // Add these programs to our result, but change the channelId to match our channel
        const programsWithCorrectChannel = mappedPrograms.map(p => ({
          ...p,
          channelId: channelId
        }));
        
        allPrograms.push(...programsWithCorrectChannel);
      }
      
      console.log(`Returning a total of ${allPrograms.length} programs for channel ${channelId}`);
      return allPrograms;
    } catch (error) {
      console.error("Error getting channel programs:", error);
      return [];
    }
  }
  
  async createProgram(program: InsertProgram): Promise<Program> {
    const id = this.programCounter++;
    const newProgram: Program = { 
      ...program, 
      id,
      description: program.description ?? null
    };
    this.programs.set(id, newProgram);
    return newProgram;
  }
  
  async updateProgram(id: number, programUpdate: Partial<InsertProgram>): Promise<Program | undefined> {
    const program = this.programs.get(id);
    if (!program) return undefined;
    
    const updatedProgram: Program = { ...program, ...programUpdate };
    this.programs.set(id, updatedProgram);
    return updatedProgram;
  }
  
  async deleteProgram(id: number): Promise<boolean> {
    return this.programs.delete(id);
  }
  
  // Movie operations
  async getMovies(): Promise<Movie[]> {
    return Array.from(this.movies.values());
  }
  
  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }
  
  async getMoviesByCategory(categoryId: number): Promise<Movie[]> {
    return Array.from(this.movies.values()).filter(
      (movie) => movie.categoryId === categoryId
    );
  }
  
  async getMoviesByCountry(countryId: number): Promise<Movie[]> {
    return Array.from(this.movies.values()).filter(
      (movie) => movie.countryId === countryId
    );
  }
  
  async createMovie(movie: InsertMovie): Promise<Movie> {
    const id = this.movieCounter++;
    const newMovie: Movie = { 
      ...movie, 
      id,
      categoryId: movie.categoryId ?? null,
      countryId: movie.countryId ?? null,
      poster: movie.poster ?? null,
      year: movie.year ?? null,
      rating: movie.rating ?? null,
      duration: movie.duration ?? null,
      isPremium: movie.isPremium ?? false
    };
    this.movies.set(id, newMovie);
    return newMovie;
  }
  
  async updateMovie(id: number, movieUpdate: Partial<InsertMovie>): Promise<Movie | undefined> {
    const movie = this.movies.get(id);
    if (!movie) return undefined;
    
    const updatedMovie: Movie = { ...movie, ...movieUpdate };
    this.movies.set(id, updatedMovie);
    return updatedMovie;
  }
  
  async deleteMovie(id: number): Promise<boolean> {
    return this.movies.delete(id);
  }
  
  // Series operations
  async getAllSeries(): Promise<Series[]> {
    return Array.from(this.series.values());
  }
  
  async getSeries(id: number): Promise<Series | undefined> {
    return this.series.get(id);
  }
  
  async getSeriesByCategory(categoryId: number): Promise<Series[]> {
    return Array.from(this.series.values()).filter(
      (series) => series.categoryId === categoryId
    );
  }
  
  async getSeriesByCountry(countryId: number): Promise<Series[]> {
    return Array.from(this.series.values()).filter(
      (series) => series.countryId === countryId
    );
  }
  
  async createSeries(series: InsertSeries): Promise<Series> {
    const id = this.seriesCounter++;
    const newSeries: Series = { 
      ...series, 
      id,
      categoryId: series.categoryId ?? null,
      countryId: series.countryId ?? null,
      poster: series.poster ?? null,
      rating: series.rating ?? null,
      isPremium: series.isPremium ?? false,
      startYear: series.startYear ?? null,
      endYear: series.endYear ?? null,
      seasons: series.seasons ?? 1
    };
    this.series.set(id, newSeries);
    return newSeries;
  }
  
  async updateSeries(id: number, seriesUpdate: Partial<InsertSeries>): Promise<Series | undefined> {
    const series = this.series.get(id);
    if (!series) return undefined;
    
    const updatedSeries: Series = { ...series, ...seriesUpdate };
    this.series.set(id, updatedSeries);
    return updatedSeries;
  }
  
  async deleteSeries(id: number): Promise<boolean> {
    return this.series.delete(id);
  }
  
  // Episode operations
  async getEpisodes(seriesId: number): Promise<Episode[]> {
    return Array.from(this.episodes.values()).filter(
      (episode) => episode.seriesId === seriesId
    );
  }
  
  async getEpisode(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }
  
  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const id = this.episodeCounter++;
    const newEpisode: Episode = { 
      ...episode, 
      id,
      description: episode.description ?? null,
      duration: episode.duration ?? null
    };
    this.episodes.set(id, newEpisode);
    return newEpisode;
  }
  
  async updateEpisode(id: number, episodeUpdate: Partial<InsertEpisode>): Promise<Episode | undefined> {
    const episode = this.episodes.get(id);
    if (!episode) return undefined;
    
    const updatedEpisode: Episode = { ...episode, ...episodeUpdate };
    this.episodes.set(id, updatedEpisode);
    return updatedEpisode;
  }
  
  async deleteEpisode(id: number): Promise<boolean> {
    return this.episodes.delete(id);
  }
  
  // EPG operations
  async getEPGSources(): Promise<EPGSource[]> {
    return Array.from(this.epgSources.values());
  }
  
  async getEPGSource(id: number): Promise<EPGSource | undefined> {
    return this.epgSources.get(id);
  }
  
  async createEPGSource(source: InsertEPGSource): Promise<EPGSource> {
    const id = this.epgSourceCounter++;
    const now = new Date();
    const newSource: EPGSource = {
      ...source,
      id,
      description: source.description ?? null,
      lastUpdate: now,
      channelCount: 0
    };
    this.epgSources.set(id, newSource);
    return newSource;
  }
  
  async updateEPGSource(id: number, sourceUpdate: Partial<InsertEPGSource>): Promise<EPGSource | undefined> {
    const source = this.epgSources.get(id);
    if (!source) return undefined;
    
    const updatedSource: EPGSource = { ...source, ...sourceUpdate };
    this.epgSources.set(id, updatedSource);
    return updatedSource;
  }
  
  async deleteEPGSource(id: number): Promise<boolean> {
    return this.epgSources.delete(id);
  }
  
  async refreshEPGSource(id: number): Promise<EPGSource | undefined> {
    const source = this.epgSources.get(id);
    if (!source) return undefined;
    
    // In a real implementation, this would fetch fresh EPG data
    const updatedSource: EPGSource = { 
      ...source, 
      lastUpdate: new Date() 
    };
    this.epgSources.set(id, updatedSource);
    return updatedSource;
  }
  
  // EPG Channel Mapping operations
  private epgChannelMappings: Map<number, EPGChannelMapping> = new Map();
  private epgChannelMappingCounter: number = 1;
  
  async getEPGChannelMappings(epgSourceId?: number): Promise<EPGChannelMapping[]> {
    const allMappings = Array.from(this.epgChannelMappings.values());
    if (epgSourceId !== undefined) {
      return allMappings.filter(mapping => mapping.epgSourceId === epgSourceId);
    }
    return allMappings;
  }
  
  async getEPGChannelMapping(id: number): Promise<EPGChannelMapping | undefined> {
    return this.epgChannelMappings.get(id);
  }
  
  async getChannelEPGMapping(channelId: number, epgSourceId: number): Promise<EPGChannelMapping | undefined> {
    return Array.from(this.epgChannelMappings.values()).find(
      mapping => mapping.channelId === channelId && mapping.epgSourceId === epgSourceId
    );
  }
  
  async createEPGChannelMapping(mapping: InsertEPGChannelMapping): Promise<EPGChannelMapping> {
    const id = this.epgChannelMappingCounter++;
    const now = new Date();
    const newMapping: EPGChannelMapping = {
      ...mapping,
      id,
      lastUpdated: now
    };
    this.epgChannelMappings.set(id, newMapping);
    return newMapping;
  }
  
  async updateEPGChannelMapping(id: number, mappingUpdate: Partial<InsertEPGChannelMapping>): Promise<EPGChannelMapping | undefined> {
    const mapping = this.epgChannelMappings.get(id);
    if (!mapping) return undefined;
    
    const updatedMapping: EPGChannelMapping = { 
      ...mapping, 
      ...mappingUpdate,
      lastUpdated: new Date()
    };
    this.epgChannelMappings.set(id, updatedMapping);
    return updatedMapping;
  }
  
  async deleteEPGChannelMapping(id: number): Promise<boolean> {
    return this.epgChannelMappings.delete(id);
  }
  
  // EPG Import Job operations
  private epgImportJobs: Map<number, EPGImportJob> = new Map();
  private epgImportJobCounter: number = 1;
  
  // Stream Token operations
  async createActiveStreamToken(token: InsertActiveStreamToken): Promise<ActiveStreamToken> {
    const now = new Date();
    const newToken: ActiveStreamToken = {
      ...token,
      id: this.tokenCounter++,
      createdAt: now,
      lastRotatedAt: null,
      isRevoked: false,
      ipAddress: token.ipAddress || null,
      userAgent: token.userAgent || null
    };
    
    this.activeTokens.set(token.tokenId, newToken);
    return newToken;
  }
  
  async getActiveStreamToken(tokenId: string): Promise<ActiveStreamToken | undefined> {
    return this.activeTokens.get(tokenId);
  }
  
  async revokeStreamToken(tokenId: string): Promise<boolean> {
    return this.activeTokens.delete(tokenId);
  }
  
  async rotateStreamToken(tokenId: string, newTokenId: string): Promise<ActiveStreamToken | undefined> {
    const token = this.activeTokens.get(tokenId);
    if (!token) return undefined;
    
    // Create a new token with the new ID but retain other properties
    const now = new Date();
    const newToken: ActiveStreamToken = {
      ...token,
      tokenId: newTokenId,
      lastRotatedAt: now
    };
    
    // Delete the old token and add the new one
    this.activeTokens.delete(tokenId);
    this.activeTokens.set(newTokenId, newToken);
    
    return newToken;
  }
  
  async getUserActiveStreamTokens(userId: number): Promise<ActiveStreamToken[]> {
    return Array.from(this.activeTokens.values())
      .filter(token => token.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async cleanupExpiredStreamTokens(): Promise<number> {
    const now = new Date();
    let removedCount = 0;
    
    Array.from(this.activeTokens.entries()).forEach(([tokenId, token]) => {
      if (token.expiresAt < now) {
        this.activeTokens.delete(tokenId);
        removedCount++;
      }
    });
    
    return removedCount;
  }
  
  // Geographic Restrictions operations
  async createGeoRestriction(restriction: InsertGeoRestriction): Promise<GeoRestriction> {
    const id = this.geoRestrictionCounter++;
    const now = new Date();
    const newRestriction: GeoRestriction = {
      ...restriction,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.geoRestrictions.set(id, newRestriction);
    return newRestriction;
  }
  
  async getGeoRestriction(id: number): Promise<GeoRestriction | undefined> {
    return this.geoRestrictions.get(id);
  }
  
  async getGeoRestrictionForContent(contentType: string, contentId: number): Promise<GeoRestriction | undefined> {
    return Array.from(this.geoRestrictions.values())
      .find(restriction => 
        restriction.contentType === contentType && 
        restriction.contentId === contentId
      );
  }
  
  async updateGeoRestriction(id: number, restriction: Partial<InsertGeoRestriction>): Promise<GeoRestriction | undefined> {
    const existingRestriction = this.geoRestrictions.get(id);
    if (!existingRestriction) return undefined;
    
    const updatedRestriction = { ...existingRestriction, ...restriction };
    this.geoRestrictions.set(id, updatedRestriction);
    return updatedRestriction;
  }
  
  async deleteGeoRestriction(id: number): Promise<boolean> {
    return this.geoRestrictions.delete(id);
  }
  
  async checkGeoRestriction(contentType: string, contentId: number, countryCode: string): Promise<boolean> {
    const restriction = await this.getGeoRestrictionForContent(contentType, contentId);
    
    if (!restriction) {
      // No restrictions, content is allowed
      return true;
    }
    
    // Check if country code is in the array of country codes
    const countryCodes = restriction.countryCodes as string[];
    const countryInList = countryCodes.includes(countryCode);
    
    if (restriction.restrictionType === 'whitelist') {
      // Whitelist mode - only allowed countries can access
      return countryInList;
    } else {
      // Blacklist mode - all countries except restricted ones can access
      return !countryInList;
    }
  }
  
  // DRM & encryption operations
  async getDRMKeyForContent(contentType: string, contentId: number): Promise<string | null> {
    const key = this.drmKeys.get(`${contentType}:${contentId}`);
    return key || null;
  }
  
  // Stream Analytics operations
  async recordStreamAnalytics(analytics: InsertStreamAnalytics): Promise<StreamAnalytics> {
    const id = this.streamAnalyticsCounter++;
    const now = new Date();
    const record: StreamAnalytics = {
      ...analytics,
      id,
      timestamp: analytics.timestamp || now,
      duration: analytics.duration || null,
      quality: analytics.quality || null,
      bandwidth: analytics.bandwidth || null,
      location: analytics.location || null,
      ipAddress: analytics.ipAddress || null,
      bufferingDuration: analytics.bufferingDuration || null,
      customData: analytics.customData || null
    };
    this.streamAnalyticsRecords.set(id, record);
    return record;
  }
  
  async getStreamAnalytics(userId?: number, contentType?: string, contentId?: number): Promise<StreamAnalytics[]> {
    let records = Array.from(this.streamAnalyticsRecords.values());
    
    if (userId !== undefined) {
      records = records.filter(record => record.userId === userId);
    }
    
    if (contentType !== undefined) {
      records = records.filter(record => record.contentType === contentType);
    }
    
    if (contentId !== undefined) {
      records = records.filter(record => record.contentId === contentId);
    }
    
    // Sort by timestamp, newest first
    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getStreamAnalyticsByEvent(event: string): Promise<StreamAnalytics[]> {
    const records = Array.from(this.streamAnalyticsRecords.values())
      .filter(record => record.event === event)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return records;
  }
  
  async getLatestStreamEvent(userId: number, contentType: string, contentId: number, event: string): Promise<StreamAnalytics | undefined> {
    const records = Array.from(this.streamAnalyticsRecords.values())
      .filter(record => 
        record.userId === userId && 
        record.contentType === contentType && 
        record.contentId === contentId && 
        record.event === event
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return records.length > 0 ? records[0] : undefined;
  }
  
  async getStreamQualityStats(userId?: number): Promise<{ quality: string; count: number }[]> {
    let records = Array.from(this.streamAnalyticsRecords.values())
      .filter(record => record.quality !== null && record.quality !== undefined);
    
    if (userId !== undefined) {
      records = records.filter(record => record.userId === userId);
    }
    
    const qualityMap = new Map<string, number>();
    
    records.forEach(record => {
      if (record.quality) {
        const count = qualityMap.get(record.quality) || 0;
        qualityMap.set(record.quality, count + 1);
      }
    });
    
    return Array.from(qualityMap.entries()).map(([quality, count]) => ({ quality, count }));
  }
  
  async getStreamBufferingStats(userId?: number, days: number = 7): Promise<{ date: string; avgBufferingMs: number; count: number }[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let records = Array.from(this.streamAnalyticsRecords.values())
      .filter(record => 
        record.event === 'buffering' && 
        record.timestamp >= cutoffDate && 
        record.bufferingDuration !== null && 
        record.bufferingDuration !== undefined
      );
    
    if (userId !== undefined) {
      records = records.filter(record => record.userId === userId);
    }
    
    const bufferingByDate = new Map<string, { total: number; count: number }>();
    
    records.forEach(record => {
      if (record.bufferingDuration !== null && record.bufferingDuration !== undefined) {
        const dateStr = record.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
        const existing = bufferingByDate.get(dateStr) || { total: 0, count: 0 };
        
        existing.total += record.bufferingDuration;
        existing.count += 1;
        
        bufferingByDate.set(dateStr, existing);
      }
    });
    
    return Array.from(bufferingByDate.entries())
      .map(([date, { total, count }]) => ({
        date,
        avgBufferingMs: Math.round(total / count),
        count
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending
  }
  
  async getEPGImportJobs(epgSourceId?: number): Promise<EPGImportJob[]> {
    const allJobs = Array.from(this.epgImportJobs.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Most recent first
    
    if (epgSourceId !== undefined) {
      return allJobs.filter(job => job.epgSourceId === epgSourceId);
    }
    return allJobs;
  }
  
  async getEPGImportJob(id: number): Promise<EPGImportJob | undefined> {
    return this.epgImportJobs.get(id);
  }
  
  async createEPGImportJob(job: InsertEPGImportJob): Promise<EPGImportJob> {
    const id = this.epgImportJobCounter++;
    const now = new Date();
    const newJob: EPGImportJob = {
      ...job,
      id,
      status: job.status || 'pending',
      startTime: job.startTime || now,
      endTime: job.endTime || null,
      programsImported: job.programsImported || 0,
      channelsImported: job.channelsImported || 0,
      errors: job.errors || [],
      logDetails: job.logDetails || null
    };
    this.epgImportJobs.set(id, newJob);
    return newJob;
  }
  
  async updateEPGImportJob(id: number, jobUpdate: Partial<InsertEPGImportJob>): Promise<EPGImportJob | undefined> {
    const job = this.epgImportJobs.get(id);
    if (!job) return undefined;
    
    const updatedJob: EPGImportJob = { ...job, ...jobUpdate };
    this.epgImportJobs.set(id, updatedJob);
    return updatedJob;
  }
  
  async deleteEPGImportJob(id: number): Promise<boolean> {
    return this.epgImportJobs.delete(id);
  }
  
  // Watch History operations
  async getUserWatchHistory(userId: number): Promise<WatchHistory[]> {
    return Array.from(this.watchHistoryRecords.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
  
  async getWatchHistory(id: number): Promise<WatchHistory | undefined> {
    return this.watchHistoryRecords.get(id);
  }
  
  async recordWatchEvent(event: InsertWatchHistory): Promise<WatchHistory> {
    const id = this.watchHistoryCounter++;
    const now = new Date();
    const record: WatchHistory = {
      ...event,
      id,
      startTime: event.startTime || now,
      endTime: event.endTime || null,
      duration: event.duration || null,
      progress: event.progress || 0,
      completed: event.completed || false
    };
    this.watchHistoryRecords.set(id, record);
    return record;
  }
  
  async updateWatchEvent(id: number, event: Partial<InsertWatchHistory>): Promise<WatchHistory | undefined> {
    const record = this.watchHistoryRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord: WatchHistory = { ...record, ...event };
    this.watchHistoryRecords.set(id, updatedRecord);
    return updatedRecord;
  }
  
  async getUserWatchStats(userId: number): Promise<any> {
    const userHistory = await this.getUserWatchHistory(userId);
    
    // Calculate total watch time
    const totalSeconds = userHistory.reduce((sum, record) => sum + (record.duration || 0), 0);
    const totalContent = userHistory.length;
    const totalCompleted = userHistory.filter(record => record.completed).length;
    
    // Group by content type
    const byContentType = userHistory.reduce((acc, record) => {
      const contentType = record.contentType;
      if (!acc[contentType]) {
        acc[contentType] = {
          contentType,
          seconds: 0,
          count: 0,
          completed: 0
        };
      }
      
      acc[contentType].seconds += (record.duration || 0);
      acc[contentType].count++;
      if (record.completed) {
        acc[contentType].completed++;
      }
      
      return acc;
    }, {} as Record<string, { contentType: string, seconds: number, count: number, completed: number }>);
    
    // Calculate most watched categories
    const categoryWatchTime: Record<number, { id: number, name: string, count: number, totalSeconds: number }> = {};
    
    // Process movie watches
    for (const record of userHistory.filter(r => r.contentType === 'movie')) {
      const movie = this.movies.get(record.contentId);
      if (movie && movie.categoryId) {
        const category = this.categories.get(movie.categoryId);
        if (category) {
          if (!categoryWatchTime[category.id]) {
            categoryWatchTime[category.id] = {
              id: category.id,
              name: category.name,
              count: 0,
              totalSeconds: 0
            };
          }
          
          categoryWatchTime[category.id].count++;
          categoryWatchTime[category.id].totalSeconds += (record.duration || 0);
        }
      }
    }
    
    // Process episode watches
    for (const record of userHistory.filter(r => r.contentType === 'episode')) {
      const episode = this.episodes.get(record.contentId);
      if (episode) {
        const seriesItem = this.series.get(episode.seriesId);
        if (seriesItem && seriesItem.categoryId) {
          const category = this.categories.get(seriesItem.categoryId);
          if (category) {
            if (!categoryWatchTime[category.id]) {
              categoryWatchTime[category.id] = {
                id: category.id,
                name: category.name,
                count: 0,
                totalSeconds: 0
              };
            }
            
            categoryWatchTime[category.id].count++;
            categoryWatchTime[category.id].totalSeconds += (record.duration || 0);
          }
        }
      }
    }
    
    // Process channel watches
    for (const record of userHistory.filter(r => r.contentType === 'channel')) {
      const channel = this.channels.get(record.contentId);
      if (channel && channel.categoryId) {
        const category = this.categories.get(channel.categoryId);
        if (category) {
          if (!categoryWatchTime[category.id]) {
            categoryWatchTime[category.id] = {
              id: category.id,
              name: category.name,
              count: 0,
              totalSeconds: 0
            };
          }
          
          categoryWatchTime[category.id].count++;
          categoryWatchTime[category.id].totalSeconds += (record.duration || 0);
        }
      }
    }
    
    // Sort categories by total time watched
    const topCategories = Object.values(categoryWatchTime)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 5);
    
    // Get recent watch history with content details
    const recentActivity = await Promise.all(
      userHistory.slice(0, 10).map(async record => {
        let title = "Unknown";
        let thumbnail = null;
        
        if (record.contentType === 'movie') {
          const movie = this.movies.get(record.contentId);
          if (movie) {
            title = movie.title;
            thumbnail = movie.poster;
          }
        } else if (record.contentType === 'episode') {
          const episode = this.episodes.get(record.contentId);
          if (episode) {
            const seriesItem = this.series.get(episode.seriesId);
            if (seriesItem) {
              title = `${seriesItem.title} - S${episode.season}E${episode.episode}`;
              thumbnail = seriesItem.poster;
            }
          }
        } else if (record.contentType === 'channel') {
          const channel = this.channels.get(record.contentId);
          if (channel) {
            title = channel.name;
            thumbnail = channel.logo;
          }
        }
        
        return {
          ...record,
          title,
          thumbnail
        };
      })
    );
    
    return {
      summary: { totalSeconds, totalContent, totalCompleted },
      byContentType: Object.values(byContentType),
      topCategories,
      recentActivity
    };
  }
  
  // User Preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferencesRecords.values())
      .find(prefs => prefs.userId === userId);
  }
  
  async toggleFavorite(userId: number, contentType: string, contentId: number): Promise<UserPreferences | undefined> {
    let userPrefs = await this.getUserPreferences(userId);
    
    // If user doesn't have preferences yet, create them
    if (!userPrefs) {
      userPrefs = await this.createUserPreferences({
        userId,
        favorites: { movies: [], series: [], channels: [] },
        preferredCategories: [],
        contentFilters: {},
        uiSettings: {}
      });
    }
    
    // Cast to any to allow dynamic property access
    const favorites = userPrefs.favorites as any;
    
    // Make sure the content type exists in favorites
    if (!favorites[contentType]) {
      favorites[contentType] = [];
    }
    
    // Check if content is already in favorites
    const index = favorites[contentType].indexOf(contentId);
    
    // If it exists, remove it; otherwise, add it
    if (index > -1) {
      favorites[contentType].splice(index, 1);
    } else {
      favorites[contentType].push(contentId);
    }
    
    // Update user preferences with the modified favorites
    return this.updateUserPreferences(userId, {
      favorites: favorites
    });
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.userPreferencesCounter++;
    const now = new Date();
    const record: UserPreferences = {
      ...preferences,
      id,
      lastUpdated: now,
      favorites: preferences.favorites || {"movies":[],"series":[],"channels":[]},
      preferredCategories: preferences.preferredCategories || [],
      contentFilters: preferences.contentFilters || {},
      uiSettings: preferences.uiSettings || {}
    };
    this.userPreferencesRecords.set(id, record);
    return record;
  }
  
  async updateUserPreferences(userId: number, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const record = Array.from(this.userPreferencesRecords.values())
      .find(p => p.userId === userId);
      
    if (!record) return undefined;
    
    // Don't update the userId
    const { userId: _, ...prefsWithoutUserId } = prefs;
    
    const updatedRecord: UserPreferences = { 
      ...record, 
      ...prefsWithoutUserId,
      lastUpdated: new Date()
    };
    
    this.userPreferencesRecords.set(record.id, updatedRecord);
    return updatedRecord;
  }
  
  // Initialize with sample data for testing
  // Site Settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    return this.siteSettingsRecord;
  }
  
  async updateSiteSettings(settings: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    const now = new Date();
    if (!this.siteSettingsRecord) {
      // Create initial settings if they don't exist
      this.siteSettingsRecord = {
        id: 1,
        siteName: settings.siteName || "StreamHive",
        logoUrl: settings.logoUrl || null,
        primaryColor: settings.primaryColor || "#3b82f6",
        enableSubscriptions: settings.enableSubscriptions ?? true,
        enablePPV: settings.enablePPV ?? false,
        enableRegistration: settings.enableRegistration ?? true,
        defaultUserQuota: settings.defaultUserQuota ?? 5,
        defaultUserConcurrentStreams: settings.defaultUserConcurrentStreams ?? 2,
        lastUpdated: now
      };
    } else {
      // Update existing settings
      this.siteSettingsRecord = {
        ...this.siteSettingsRecord,
        ...settings,
        lastUpdated: now
      };
    }
    
    return this.siteSettingsRecord;
  }
  
  // Crypto Payment operations
  async getCryptoPayment(id: number): Promise<CryptoPayment | undefined> {
    return this.cryptoPayments.get(id);
  }
  
  async getCryptoPaymentsByUserId(userId: number): Promise<CryptoPayment[]> {
    return Array.from(this.cryptoPayments.values()).filter(
      payment => payment.userId === userId
    );
  }
  
  async createCryptoPayment(payment: InsertCryptoPayment): Promise<CryptoPayment> {
    const id = this.cryptoPaymentCounter++;
    const now = new Date();
    const newPayment: CryptoPayment = {
      ...payment,
      id,
      createdAt: now,
      completedAt: null,
      status: payment.status || 'pending',
      transactionId: payment.transactionId || null,
      // Make sure expiresAt is always defined
      expiresAt: payment.expiresAt || new Date(now.getTime() + 24 * 60 * 60 * 1000) // Default 24 hours expiry
    };
    this.cryptoPayments.set(id, newPayment);
    return newPayment;
  }
  
  async updateCryptoPayment(id: number, paymentUpdate: Partial<CryptoPayment>): Promise<CryptoPayment | undefined> {
    const payment = this.cryptoPayments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment: CryptoPayment = { ...payment, ...paymentUpdate };
    this.cryptoPayments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async getPendingCryptoPayments(): Promise<CryptoPayment[]> {
    return Array.from(this.cryptoPayments.values()).filter(
      payment => payment.status === 'pending' && payment.expiresAt > new Date()
    );
  }
  
  // User subscription operations
  async updateUserSubscription(userId: number, subscription: { isPremium: boolean; premiumTier?: string; premiumExpiresAt?: Date }): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Update user with premium subscription details
    const updatedUser = {
      ...user,
      isPremium: subscription.isPremium,
      premiumPlan: subscription.premiumTier || null,
      premiumExpiry: subscription.premiumExpiresAt || null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Stripe user info operations
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Update user with Stripe-related info
    const updatedUser = {
      ...user,
      stripeCustomerId: stripeInfo.stripeCustomerId || user.stripeCustomerId || null,
      stripeSubscriptionId: stripeInfo.stripeSubscriptionId || user.stripeSubscriptionId || null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async checkUserPremiumStatus(userId: number): Promise<{ isPremium: boolean; planName: string | null; expiryDate: Date | null }> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // If user is not premium, return false right away
    if (!user.isPremium) {
      return {
        isPremium: false,
        planName: null,
        expiryDate: null
      };
    }
    
    // Check if premium has expired
    const now = new Date();
    const expiryDate = user.premiumExpiry;
    const isExpired = expiryDate && expiryDate < now;
    
    // If premium is expired, update user record automatically
    if (isExpired) {
      this.updateUserSubscription(userId, {
        isPremium: false,
        premiumTier: null,
        premiumExpiresAt: null
      });
      
      return {
        isPremium: false,
        planName: null,
        expiryDate: null
      };
    }
    
    // Premium is active
    return {
      isPremium: true,
      planName: user.premiumPlan,
      expiryDate: user.premiumExpiry
    };
  }
  
  // Premium content operations
  async getPremiumMovies(): Promise<Movie[]> {
    return Array.from(this.movies.values()).filter(movie => movie.isPremium);
  }
  
  async getPremiumSeries(): Promise<Series[]> {
    return Array.from(this.series.values()).filter(series => series.isPremium);
  }
  
  async getPremiumChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(channel => channel.isPremium);
  }
  
  // PPV operations
  async createPPVPurchase(purchase: InsertPPVPurchase): Promise<PPVPurchase> {
    const id = this.ppvPurchaseCounter++;
    const now = new Date();
    const newPurchase: PPVPurchase = {
      ...purchase,
      id,
      purchasedAt: now,
      status: purchase.status || 'pending',
      isActive: purchase.isActive !== undefined ? purchase.isActive : true,
      paymentId: purchase.paymentId || null
    };
    this.ppvPurchases.set(id, newPurchase);
    return newPurchase;
  }
  
  async getPPVPurchaseById(id: number): Promise<PPVPurchase | undefined> {
    return this.ppvPurchases.get(id);
  }
  
  async getPPVPurchasesByUserId(userId: number): Promise<PPVPurchase[]> {
    return Array.from(this.ppvPurchases.values())
      .filter(purchase => purchase.userId === userId)
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
  }
  
  async getUserPPVForContent(userId: number, contentType: string, contentId: number): Promise<PPVPurchase | undefined> {
    const now = new Date();
    return Array.from(this.ppvPurchases.values()).find(
      purchase => purchase.userId === userId && 
                 purchase.contentType === contentType && 
                 purchase.contentId === contentId &&
                 purchase.status === 'completed' &&
                 purchase.isActive &&
                 purchase.expiresAt >= now
    );
  }
  
  async updatePPVPurchaseStatus(id: number, status: string): Promise<PPVPurchase | undefined> {
    const purchase = this.ppvPurchases.get(id);
    if (!purchase) return undefined;
    
    const updatedPurchase: PPVPurchase = { ...purchase, status };
    this.ppvPurchases.set(id, updatedPurchase);
    return updatedPurchase;
  }
  
  async deactivatePPVPurchase(id: number): Promise<PPVPurchase | undefined> {
    const purchase = this.ppvPurchases.get(id);
    if (!purchase) return undefined;
    
    const updatedPurchase: PPVPurchase = { ...purchase, isActive: false };
    this.ppvPurchases.set(id, updatedPurchase);
    return updatedPurchase;
  }
  
  async getActivePPVPurchases(): Promise<PPVPurchase[]> {
    const now = new Date();
    return Array.from(this.ppvPurchases.values())
      .filter(purchase => purchase.isActive && purchase.status === 'completed' && purchase.expiresAt >= now);
  }
  
  async getPopularPPVContent(): Promise<any[]> {
    // Get statistics on PPV content in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Group purchases by content type and ID
    const purchaseCounts: Record<string, { count: number, contentType: string, contentId: number }> = {};
    
    Array.from(this.ppvPurchases.values())
      .filter(purchase => purchase.purchasedAt >= oneMonthAgo && purchase.status === 'completed')
      .forEach(purchase => {
        const key = `${purchase.contentType}-${purchase.contentId}`;
        if (!purchaseCounts[key]) {
          purchaseCounts[key] = { 
            count: 0, 
            contentType: purchase.contentType, 
            contentId: purchase.contentId 
          };
        }
        purchaseCounts[key].count++;
      });
    
    // Convert to array and sort by count
    const popularItems = Object.values(purchaseCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
    
    // Enrich with content details
    const enrichedItems = await Promise.all(popularItems.map(async (item) => {
      let contentDetails: any = { title: 'Unknown Content' };
      
      try {
        if (item.contentType === 'movie') {
          const movie = await this.getMovie(item.contentId);
          if (movie) {
            contentDetails = {
              title: movie.title,
              poster: movie.poster,
              year: movie.year,
              id: movie.id
            };
          }
        } else if (item.contentType === 'series') {
          const series = await this.getSeries(item.contentId);
          if (series) {
            contentDetails = {
              title: series.title,
              poster: series.poster,
              seasons: series.seasons,
              id: series.id
            };
          }
        } else if (item.contentType === 'channel') {
          const channel = await this.getChannel(item.contentId);
          if (channel) {
            contentDetails = {
              title: channel.name,
              logo: channel.logo,
              id: channel.id
            };
          }
        }
      } catch (error) {
        console.error('Error enriching popular PPV item:', error);
      }
      
      return {
        contentType: item.contentType,
        contentId: item.contentId,
        purchaseCount: item.count,
        content: contentDetails
      };
    }));
    
    return enrichedItems;
  }
  
  private initializeSampleData() {
    // Initialize default site settings
    this.siteSettingsRecord = {
      id: 1,
      siteName: "Streamvy",
      logoUrl: null,
      primaryColor: "#3b82f6",
      enableSubscriptions: true,
      enablePPV: false,
      enableRegistration: true,
      defaultUserQuota: 5,
      defaultUserConcurrentStreams: 2,
      lastUpdated: new Date()
    };
    
    // Create initial admin user with properly formatted password for our scrypt implementation
    // Format is hash.salt where password is "password"
    const adminUser: User = {
      id: 1,
      username: "admin",
      password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.dddddddddddddddddddddddddddddddd",
      isAdmin: true,
      createdAt: new Date(),
      isPremium: false,
      premiumPlan: null,
      premiumExpiry: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    this.users.set(1, adminUser);
    
    // Set counter to 2 so next user gets ID 2
    this.userCounter = 2;
    
    console.log("Admin user created with username 'admin' and password 'password'");
    
    // Create categories
    const categoriesData: InsertCategory[] = [
      { 
        name: "Sports", 
        slug: "sports", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />',
        gradientFrom: "#8b5cf6",
        gradientTo: "#ec4899"
      },
      { 
        name: "News", 
        slug: "news", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />',
        gradientFrom: "#3b82f6",
        gradientTo: "#06b6d4"
      },
      { 
        name: "Movies", 
        slug: "movies", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />',
        gradientFrom: "#ef4444",
        gradientTo: "#ec4899"
      },
      { 
        name: "Series", 
        slug: "series", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />',
        gradientFrom: "#8b5cf6",
        gradientTo: "#6366f1"
      },
      { 
        name: "Kids", 
        slug: "kids", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
        gradientFrom: "#f59e0b",
        gradientTo: "#f97316"
      },
      { 
        name: "International", 
        slug: "international", 
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />',
        gradientFrom: "#10b981",
        gradientTo: "#84cc16" 
      }
    ];
    
    categoriesData.forEach(category => {
      this.createCategory(category);
    });
    
    // Create countries
    const countriesData: InsertCountry[] = [
      { name: "United States", code: "us" },
      { name: "United Kingdom", code: "gb" },
      { name: "Canada", code: "ca" },
      { name: "France", code: "fr" },
      { name: "Germany", code: "de" },
      { name: "India", code: "in" }
    ];
    
    countriesData.forEach(country => {
      this.createCountry(country);
    });
    
    // Create channels
    const channelsData: InsertChannel[] = [
      {
        name: "ESPN",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_logo.svg/1280px-ESPN_logo.svg.png",
        categoryId: 1, // Sports
        countryId: 1, // US
        epgId: "espn.us",
        streamSources: [
          { url: "https://example.com/espn.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/espn.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "CNN",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/1280px-CNN.svg.png",
        categoryId: 2, // News
        countryId: 1, // US
        epgId: "cnn.us",
        streamSources: [
          { url: "https://example.com/cnn.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/cnn.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "BBC One",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/BBC_One_logo_2021.svg/1280px-BBC_One_logo_2021.svg.png",
        categoryId: 2, // News
        countryId: 2, // UK
        epgId: "bbc1.uk",
        streamSources: [
          { url: "https://example.com/bbc1.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/bbc1.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "Fox Sports",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/2015_Fox_Sports_1_logo.svg/1280px-2015_Fox_Sports_1_logo.svg.png",
        categoryId: 1, // Sports
        countryId: 1, // US
        epgId: "foxsports.us",
        streamSources: [
          { url: "https://example.com/foxsports.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/foxsports.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      },
      {
        name: "Disney Channel",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/2019_Disney_Channel_logo.svg/1280px-2019_Disney_Channel_logo.svg.png",
        categoryId: 5, // Kids
        countryId: 1, // US
        epgId: "disney.us",
        streamSources: [
          { url: "https://example.com/disney.m3u8", priority: 1, format: "hls", label: "Main" },
          { url: "https://backup.example.com/disney.m3u8", priority: 2, format: "hls", label: "Backup" }
        ]
      }
    ];
    
    channelsData.forEach(channel => {
      this.createChannel(channel);
    });
    
    // Create current programs
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() - 1);
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 1);
    
    const programsData: InsertProgram[] = [
      {
        channelId: 1,
        title: "NBA 2023: Lakers vs Warriors",
        startTime,
        endTime,
        description: "Live NBA action featuring Los Angeles Lakers vs Golden State Warriors."
      },
      {
        channelId: 2,
        title: "Breaking News: World Updates",
        startTime,
        endTime,
        description: "Get the latest updates on current events from around the world."
      },
      {
        channelId: 3,
        title: "Doctor Who: New Episode",
        startTime,
        endTime,
        description: "The Doctor faces a new enemy in this thrilling episode."
      },
      {
        channelId: 4,
        title: "NFL: Eagles vs Cowboys",
        startTime,
        endTime,
        description: "Live NFL action featuring Philadelphia Eagles vs Dallas Cowboys."
      },
      {
        channelId: 5,
        title: "Animated Movie Marathon",
        startTime,
        endTime,
        description: "A marathon of classic Disney animated movies."
      }
    ];
    
    programsData.forEach(program => {
      this.createProgram(program);
    });
    
    // Create movies
    const moviesData: InsertMovie[] = [
      {
        title: "Interstellar",
        poster: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
        year: 2014,
        rating: "8.6",
        duration: 169,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/interstellar.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/interstellar.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "The Dark Knight",
        poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg",
        year: 2008,
        rating: "9.0",
        duration: 152,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/dark-knight.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/dark-knight.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "Inception",
        poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
        year: 2010,
        rating: "8.8",
        duration: 148,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/inception.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/inception.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "Avengers: Endgame",
        poster: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg",
        year: 2019,
        rating: "8.4",
        duration: 181,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/avengers-endgame.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/avengers-endgame.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      },
      {
        title: "Joker",
        poster: "https://m.media-amazon.com/images/M/MV5BNGVjNWI4ZGUtNzE0MS00YTJmLWE0ZDctN2ZiYTk2YmI3NTYyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        year: 2019,
        rating: "8.5",
        duration: 122,
        categoryId: 3, // Movies
        streamSources: [
          { url: "https://example.com/joker.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/joker.mp4", priority: 2, format: "mp4", label: "SD" }
        ],
        isPremium: false
      }
    ];
    
    moviesData.forEach(movie => {
      this.createMovie(movie);
    });
    
    // Create series
    const seriesData: InsertSeries[] = [
      {
        title: "Breaking Bad",
        poster: "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg",
        startYear: 2008,
        endYear: 2013,
        rating: "9.5",
        categoryId: 4, // Series
        seasons: 5,
        isPremium: false
      },
      {
        title: "Game of Thrones",
        poster: "https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_.jpg",
        startYear: 2011,
        endYear: 2019,
        rating: "9.3",
        categoryId: 4, // Series
        seasons: 8,
        isPremium: false
      },
      {
        title: "Stranger Things",
        poster: "https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3MjYtZGMzZWI1ZjhlOWJmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        startYear: 2016,
        endYear: null,
        rating: "8.7",
        categoryId: 4, // Series
        seasons: 4,
        isPremium: false
      },
      {
        title: "The Mandalorian",
        poster: "https://m.media-amazon.com/images/M/MV5BYTQwYzVlODQtNzFmMC00MjYyLWFhMWUtZTZiN2Y2N2Q2NDMyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
        startYear: 2019,
        endYear: null,
        rating: "8.8",
        categoryId: 4, // Series
        seasons: 3,
        isPremium: false
      },
      {
        title: "The Office",
        poster: "https://m.media-amazon.com/images/M/MV5BMDNkOTE4NDQtMTNmYi00MWE0LWE4ZTktYTc0NzhhNWIzNzJiXkEyXkFqcGdeQXVyMzQ2MDI5NjU@._V1_.jpg",
        startYear: 2005,
        endYear: 2013,
        rating: "8.9",
        categoryId: 4, // Series
        seasons: 9,
        isPremium: false
      }
    ];
    
    seriesData.forEach(series => {
      this.createSeries(series);
    });
    
    // Create episodes for Breaking Bad (just first season)
    const breakingBadEpisodes: InsertEpisode[] = [
      {
        seriesId: 1,
        season: 1,
        episode: 1,
        title: "Pilot",
        description: "Chemistry teacher Walter White discovers he has cancer and turns to a life of crime.",
        duration: 58,
        streamSources: [
          { url: "https://example.com/breaking-bad/s01e01.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/breaking-bad/s01e01.mp4", priority: 2, format: "mp4", label: "SD" }
        ]
      },
      {
        seriesId: 1,
        season: 1,
        episode: 2,
        title: "Cat's in the Bag...",
        description: "Walter and Jesse try to dispose of the bodies of two rivals.",
        duration: 48,
        streamSources: [
          { url: "https://example.com/breaking-bad/s01e02.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/breaking-bad/s01e02.mp4", priority: 2, format: "mp4", label: "SD" }
        ]
      },
      {
        seriesId: 1,
        season: 1,
        episode: 3,
        title: "...And the Bag's in the River",
        description: "Walter faces a difficult decision regarding one of his rivals.",
        duration: 47,
        streamSources: [
          { url: "https://example.com/breaking-bad/s01e03.m3u8", priority: 1, format: "hls", label: "HD" },
          { url: "https://backup.example.com/breaking-bad/s01e03.mp4", priority: 2, format: "mp4", label: "SD" }
        ]
      }
    ];
    
    breakingBadEpisodes.forEach(episode => {
      this.createEpisode(episode);
    });
  }
}

// PostgreSQL storage implementation
export class DatabaseStorage implements IStorage {
  // Session store
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // Premium content operations
  async getPremiumMovies(): Promise<Movie[]> {
    return await db
      .select()
      .from(movies)
      .where(eq(movies.isPremium, true));
  }
  
  async getPremiumSeries(): Promise<Series[]> {
    return await db
      .select()
      .from(series)
      .where(eq(series.isPremium, true));
  }
  
  async getPremiumChannels(): Promise<Channel[]> {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.isPremium, true));
  }
  
  // PPV operations
  async createPPVPurchase(purchase: InsertPPVPurchase): Promise<PPVPurchase> {
    const [newPurchase] = await db
      .insert(ppvPurchases)
      .values(purchase)
      .returning();
    return newPurchase;
  }
  
  async getPPVPurchaseById(id: number): Promise<PPVPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(ppvPurchases)
      .where(eq(ppvPurchases.id, id));
    return purchase || undefined;
  }
  
  async getPPVPurchasesByUserId(userId: number): Promise<PPVPurchase[]> {
    return await db
      .select()
      .from(ppvPurchases)
      .where(eq(ppvPurchases.userId, userId))
      .orderBy(desc(ppvPurchases.purchasedAt));
  }
  
  async getUserPPVForContent(userId: number, contentType: string, contentId: number): Promise<PPVPurchase | undefined> {
    const now = new Date();
    const [purchase] = await db
      .select()
      .from(ppvPurchases)
      .where(
        and(
          eq(ppvPurchases.userId, userId),
          eq(ppvPurchases.contentType, contentType),
          eq(ppvPurchases.contentId, contentId),
          eq(ppvPurchases.status, 'completed'),
          eq(ppvPurchases.isActive, true),
          gte(ppvPurchases.expiresAt, now)
        )
      );
    return purchase || undefined;
  }
  
  async updatePPVPurchaseStatus(id: number, status: string): Promise<PPVPurchase | undefined> {
    const [updatedPurchase] = await db
      .update(ppvPurchases)
      .set({ status })
      .where(eq(ppvPurchases.id, id))
      .returning();
    return updatedPurchase || undefined;
  }
  
  async deactivatePPVPurchase(id: number): Promise<PPVPurchase | undefined> {
    const [updatedPurchase] = await db
      .update(ppvPurchases)
      .set({ isActive: false })
      .where(eq(ppvPurchases.id, id))
      .returning();
    return updatedPurchase || undefined;
  }
  
  async getActivePPVPurchases(): Promise<PPVPurchase[]> {
    const now = new Date();
    return await db
      .select()
      .from(ppvPurchases)
      .where(
        and(
          eq(ppvPurchases.isActive, true),
          eq(ppvPurchases.status, 'completed'),
          gte(ppvPurchases.expiresAt, now)
        )
      );
  }
  
  // Watch History operations
  async getUserWatchHistory(userId: number): Promise<WatchHistory[]> {
    return await db
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId))
      .orderBy(desc(watchHistory.startTime));
  }
  
  async getWatchHistory(id: number): Promise<WatchHistory | undefined> {
    const [record] = await db
      .select()
      .from(watchHistory)
      .where(eq(watchHistory.id, id));
    return record;
  }
  
  async recordWatchEvent(event: InsertWatchHistory): Promise<WatchHistory> {
    const [record] = await db
      .insert(watchHistory)
      .values(event)
      .returning();
    return record;
  }
  
  async updateWatchEvent(id: number, event: Partial<InsertWatchHistory>): Promise<WatchHistory | undefined> {
    const [record] = await db
      .update(watchHistory)
      .set(event)
      .where(eq(watchHistory.id, id))
      .returning();
    return record;
  }
  
  async getUserWatchStats(userId: number): Promise<any> {
    // Get total watch time across all content types
    const totalWatchTime = await db
      .select({ 
        totalSeconds: sql`SUM(${watchHistory.duration})`,
        totalContent: sql`COUNT(*)`,
        totalCompleted: sql`SUM(CASE WHEN ${watchHistory.completed} = true THEN 1 ELSE 0 END)`
      })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));
      
    // Get watch time by content type
    const watchTimeByType = await db
      .select({ 
        contentType: watchHistory.contentType,
        seconds: sql`SUM(${watchHistory.duration})`,
        count: sql`COUNT(*)`,
        completed: sql`SUM(CASE WHEN ${watchHistory.completed} = true THEN 1 ELSE 0 END)`
      })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId))
      .groupBy(watchHistory.contentType);
      
    // Get most watched categories
    const mostWatchedCategories = await db.execute(sql`
      SELECT c.name, c.id, COUNT(*) as count, SUM(wh.duration) as total_seconds
      FROM watch_history wh
      JOIN movies m ON wh.content_type = 'movie' AND wh.content_id = m.id
      JOIN categories c ON m.category_id = c.id
      WHERE wh.user_id = ${userId}
      GROUP BY c.id, c.name
      UNION ALL
      SELECT c.name, c.id, COUNT(*) as count, SUM(wh.duration) as total_seconds
      FROM watch_history wh
      JOIN episodes e ON wh.content_type = 'episode' AND wh.content_id = e.id
      JOIN series s ON e.series_id = s.id
      JOIN categories c ON s.category_id = c.id
      WHERE wh.user_id = ${userId}
      GROUP BY c.id, c.name
      UNION ALL
      SELECT c.name, c.id, COUNT(*) as count, SUM(wh.duration) as total_seconds
      FROM watch_history wh
      JOIN channels ch ON wh.content_type = 'channel' AND wh.content_id = ch.id
      JOIN categories c ON ch.category_id = c.id
      WHERE wh.user_id = ${userId}
      GROUP BY c.id, c.name
      ORDER BY total_seconds DESC
      LIMIT 5
    `);
    
    // Get recent watch history with content details
    const recentActivity = await db.execute(sql`
      SELECT 
        wh.id, 
        wh.content_type, 
        wh.content_id, 
        wh.start_time, 
        wh.end_time, 
        wh.duration, 
        wh.progress,
        wh.completed,
        COALESCE(m.title, s.title, ch.name, 'Unknown') as title,
        COALESCE(m.poster, s.poster, ch.logo, NULL) as thumbnail
      FROM watch_history wh
      LEFT JOIN movies m ON wh.content_type = 'movie' AND wh.content_id = m.id
      LEFT JOIN channels ch ON wh.content_type = 'channel' AND wh.content_id = ch.id
      LEFT JOIN episodes e ON wh.content_type = 'episode' AND wh.content_id = e.id
      LEFT JOIN series s ON e.series_id = s.id
      WHERE wh.user_id = ${userId}
      ORDER BY wh.start_time DESC
      LIMIT 10
    `);
    
    return {
      summary: totalWatchTime[0] || { totalSeconds: 0, totalContent: 0, totalCompleted: 0 },
      byContentType: watchTimeByType,
      topCategories: mostWatchedCategories,
      recentActivity: recentActivity
    };
  }
  
  // User Preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [record] = await db
      .insert(userPreferences)
      .values(preferences)
      .returning();
    return record;
  }
  
  async updateUserPreferences(userId: number, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    // Don't update the userId
    const { userId: _, ...prefsWithoutUserId } = prefs;
    
    const [record] = await db
      .update(userPreferences)
      .set({
        ...prefsWithoutUserId,
        lastUpdated: new Date()
      })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return record;
  }
  
  async toggleFavorite(userId: number, contentType: string, contentId: number): Promise<UserPreferences | undefined> {
    let userPrefs = await this.getUserPreferences(userId);
    
    // If user doesn't have preferences yet, create them
    if (!userPrefs) {
      userPrefs = await this.createUserPreferences({
        userId,
        favorites: { movies: [], series: [], channels: [] },
        preferredCategories: [],
        contentFilters: {},
        uiSettings: {}
      });
    }
    
    // Cast to any to allow dynamic property access
    const favorites = userPrefs.favorites as any;
    
    // Make sure the content type exists in favorites
    if (!favorites[contentType]) {
      favorites[contentType] = [];
    }
    
    // Check if content is already in favorites
    const index = favorites[contentType].indexOf(contentId);
    
    // If it exists, remove it; otherwise, add it
    if (index > -1) {
      favorites[contentType].splice(index, 1);
    } else {
      favorites[contentType].push(contentId);
    }
    
    // Update user preferences with the modified favorites
    return this.updateUserPreferences(userId, {
      favorites: favorites
    });
  }
  
  // Site Settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    try {
      // Using direct SQL query for debugging
      const result = await db.execute(sql`
        SELECT * FROM site_settings LIMIT 1
      `);
      console.log("Site settings result:", result);
      
      if (result.rows && result.rows.length > 0) {
        // Use the actual column names from the database - they're already in camelCase
        const row = result.rows[0] as Record<string, any>;
        console.log("Site settings row:", row);
        
        // Debug what properties are available
        console.log("Properties in row:", Object.keys(row));
        
        const settings: SiteSettings = {
          id: Number(row.id),
          siteName: String(row.siteName || 'StreamHive'),
          logoUrl: row.logoUrl ? String(row.logoUrl) : null,
          primaryColor: String(row.primaryColor || '#3b82f6'),
          enableSubscriptions: Boolean(row.enableSubscriptions),
          enablePPV: Boolean(row.enablePPV),
          enableRegistration: Boolean(row.enableRegistration),
          defaultUserQuota: Number(row.defaultUserQuota || 5),
          defaultUserConcurrentStreams: Number(row.defaultUserConcurrentStreams || 2),
          lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : new Date()
        };
        
        console.log("Mapped settings:", settings);
        return settings;
      }
      return undefined;
    } catch (error) {
      console.error("Error getting site settings:", error);
      return undefined;
    }
  }
  
  async updateSiteSettings(settingsData: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    try {
      const currentSettings = await this.getSiteSettings();
      const now = new Date();
      
      if (!currentSettings) {
        // Create new settings if they don't exist
        const result = await db.execute(sql`
          INSERT INTO site_settings (
            "siteName", 
            "logoUrl", 
            "primaryColor", 
            "enableSubscriptions", 
            "enablePPV", 
            "enableRegistration", 
            "defaultUserQuota", 
            "defaultUserConcurrentStreams", 
            "lastUpdated"
          ) VALUES (
            ${settingsData.siteName || "StreamHive"},
            ${settingsData.logoUrl || null},
            ${settingsData.primaryColor || "#3b82f6"},
            ${settingsData.enableSubscriptions ?? true},
            ${settingsData.enablePPV ?? false},
            ${settingsData.enableRegistration ?? true},
            ${settingsData.defaultUserQuota ?? 5},
            ${settingsData.defaultUserConcurrentStreams ?? 2},
            ${now}
          ) RETURNING *
        `);
        
        const row = result.rows[0] as Record<string, any>;
        return {
          id: Number(row.id),
          siteName: String(row.siteName || 'StreamHive'),
          logoUrl: row.logoUrl ? String(row.logoUrl) : null,
          primaryColor: String(row.primaryColor || '#3b82f6'),
          enableSubscriptions: Boolean(row.enableSubscriptions),
          enablePPV: Boolean(row.enablePPV),
          enableRegistration: Boolean(row.enableRegistration),
          defaultUserQuota: Number(row.defaultUserQuota || 5),
          defaultUserConcurrentStreams: Number(row.defaultUserConcurrentStreams || 2),
          lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : new Date()
        };
      } else {
        // Build SQL parts for updating
        let updateSQL = sql`
          UPDATE site_settings
          SET 
        `;
        
        // Start with an empty array and gradually build up the SQL parts
        const parts: any[] = [];
        
        if (settingsData.siteName !== undefined) {
          parts.push(sql`"siteName" = ${settingsData.siteName}`);
        }
        
        if (settingsData.logoUrl !== undefined) {
          parts.push(sql`"logoUrl" = ${settingsData.logoUrl}`);
        }
        
        if (settingsData.primaryColor !== undefined) {
          parts.push(sql`"primaryColor" = ${settingsData.primaryColor}`);
        }
        
        if (settingsData.enableSubscriptions !== undefined) {
          parts.push(sql`"enableSubscriptions" = ${settingsData.enableSubscriptions}`);
        }
        
        if (settingsData.enablePPV !== undefined) {
          parts.push(sql`"enablePPV" = ${settingsData.enablePPV}`);
        }
        
        if (settingsData.enableRegistration !== undefined) {
          parts.push(sql`"enableRegistration" = ${settingsData.enableRegistration}`);
        }
        
        if (settingsData.defaultUserQuota !== undefined) {
          parts.push(sql`"defaultUserQuota" = ${settingsData.defaultUserQuota}`);
        }
        
        if (settingsData.defaultUserConcurrentStreams !== undefined) {
          parts.push(sql`"defaultUserConcurrentStreams" = ${settingsData.defaultUserConcurrentStreams}`);
        }
        
        // Always update lastUpdated
        parts.push(sql`"lastUpdated" = ${now}`);
        
        // If no parts to update, return existing settings
        if (parts.length === 0) {
          return currentSettings;
        }
        
        // Join parts with commas
        let firstPart = parts[0];
        let restParts = parts.slice(1);
        
        let setClause = firstPart;
        for (const part of restParts) {
          setClause = sql`${setClause}, ${part}`;
        }
        
        // Complete the SQL query
        const fullQuery = sql`
          ${updateSQL} ${setClause}
          WHERE id = ${currentSettings.id}
          RETURNING *
        `;
        
        // Execute the query
        const result = await db.execute(fullQuery);
        
        const row = result.rows[0] as Record<string, any>;
        return {
          id: Number(row.id),
          siteName: String(row.siteName || 'StreamHive'),
          logoUrl: row.logoUrl ? String(row.logoUrl) : null,
          primaryColor: String(row.primaryColor || '#3b82f6'),
          enableSubscriptions: Boolean(row.enableSubscriptions),
          enablePPV: Boolean(row.enablePPV),
          enableRegistration: Boolean(row.enableRegistration),
          defaultUserQuota: Number(row.defaultUserQuota || 5),
          defaultUserConcurrentStreams: Number(row.defaultUserConcurrentStreams || 2),
          lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : new Date()
        };
      }
    } catch (error) {
      console.error("Error updating site settings:", error);
      throw new Error("Failed to update site settings");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Make sure premium fields have defaults if not provided
    const userToInsert = {
      ...insertUser,
      isPremium: insertUser.isPremium ?? false,
      premiumPlan: insertUser.premiumPlan || null,
      premiumExpiry: insertUser.premiumExpiry || null,
      stripeCustomerId: insertUser.stripeCustomerId || null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId || null
    };
    
    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(
    id: number,
    categoryUpdate: Partial<InsertCategory>
  ): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryUpdate)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      // First check if category exists
      const category = await this.getCategory(id);
      if (!category) {
        return false;
      }
      
      // Update all references to this category to null instead of deleting them
      // Update channels
      await db
        .update(channels)
        .set({ categoryId: null })
        .where(eq(channels.categoryId, id));
        
      // Update movies
      await db
        .update(movies)
        .set({ categoryId: null })
        .where(eq(movies.categoryId, id));
        
      // Update series
      await db
        .update(series)
        .set({ categoryId: null })
        .where(eq(series.categoryId, id));
        
      // Then delete the category
      const result = await db
        .delete(categories)
        .where(eq(categories.id, id))
        .returning({ id: categories.id });
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }

  // Country operations
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries);
  }

  async getCountry(id: number): Promise<Country | undefined> {
    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, id));
    return country;
  }

  async createCountry(country: InsertCountry): Promise<Country> {
    const [newCountry] = await db
      .insert(countries)
      .values(country)
      .returning();
    return newCountry;
  }

  async updateCountry(
    id: number,
    countryUpdate: Partial<InsertCountry>
  ): Promise<Country | undefined> {
    const [updatedCountry] = await db
      .update(countries)
      .set(countryUpdate)
      .where(eq(countries.id, id))
      .returning();
    return updatedCountry;
  }

  async deleteCountry(id: number): Promise<boolean> {
    try {
      // First check if country exists
      const country = await this.getCountry(id);
      if (!country) {
        return false;
      }
      
      // Update all channels with this country reference to null
      await db
        .update(channels)
        .set({ countryId: null })
        .where(eq(channels.countryId, id));
        
      // Then delete the country
      const result = await db
        .delete(countries)
        .where(eq(countries.id, id))
        .returning({ id: countries.id });
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting country:", error);
      return false;
    }
  }

  // Channel operations
  async getChannels(): Promise<Channel[]> {
    return await db.select().from(channels);
  }

  async getChannel(id: number): Promise<Channel | undefined> {
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, id));
    return channel;
  }

  async getChannelsByCategory(categoryId: number): Promise<Channel[]> {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.categoryId, categoryId));
  }

  async getChannelsByCountry(countryId: number): Promise<Channel[]> {
    return await db
      .select()
      .from(channels)
      .where(eq(channels.countryId, countryId));
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    // Ensure status and other fields have default values if not provided
    const channelWithDefaults = {
      ...channel,
      status: channel.status || 'unknown',
      lastChecked: channel.lastChecked || null,
      isPremium: channel.isPremium ?? false // Explicitly set default for isPremium
    };
    
    const [newChannel] = await db
      .insert(channels)
      .values(channelWithDefaults)
      .returning();
    return newChannel;
  }

  async updateChannel(
    id: number,
    channelUpdate: Partial<InsertChannel>
  ): Promise<Channel | undefined> {
    const [updatedChannel] = await db
      .update(channels)
      .set(channelUpdate)
      .where(eq(channels.id, id))
      .returning();
    return updatedChannel;
  }

  async deleteChannel(id: number): Promise<boolean> {
    try {
      // First check if channel exists
      const channel = await this.getChannel(id);
      if (!channel) {
        console.log("Channel not found:", id);
        return false;
      }
      
      console.log("Deleting channel with ID:", id);
      
      try {
        // First delete all programs associated with this channel
        console.log("Deleting associated programs...");
        await db
          .delete(programs)
          .where(eq(programs.channelId, id));
          
        console.log("Associated programs deleted");
      } catch (programError) {
        console.error("Error deleting channel programs:", programError);
        // Continue with channel deletion even if program deletion fails
      }
        
      try {
        // Then delete the channel
        console.log("Deleting channel...");
        const result = await db
          .delete(channels)
          .where(eq(channels.id, id))
          .returning({ id: channels.id });
          
        console.log("Channel delete result:", result);
        return result.length > 0;
      } catch (channelError) {
        console.error("Error in actual channel deletion:", channelError);
        throw channelError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      return false;
    }
  }

  // Program operations
  async getCurrentPrograms(): Promise<Program[]> {
    const now = new Date();
    try {
      return await db
        .select()
        .from(programs)
        .where(
          and(
            lte(programs.startTime, now),
            gte(programs.endTime, now)
          )
        );
    } catch (error) {
      console.error("Error getting current programs:", error);
      return [];
    }
  }

  async getChannelPrograms(channelId: number): Promise<Program[]> {
    try {
      // First try to get the channel to check if it has an EPG ID
      const channel = await this.getChannel(channelId);
      
      if (!channel || !channel.epgId) {
        // If no channel or no EPG ID, just return programs directly mapped to this channel
        return await db
          .select()
          .from(programs)
          .where(eq(programs.channelId, channelId));
      }
      
      // Find all EPG sources
      const epgSources = await this.getEPGSources();
      
      // If we have an EPG ID, check for mappings across all sources
      const programsResult = await db
        .select()
        .from(programs)
        .where(eq(programs.channelId, channelId));
      
      if (programsResult.length > 0) {
        console.log(`Found ${programsResult.length} programs for channel ${channelId} with direct mapping`);
        return programsResult;
      }
      
      // If no directly mapped programs, look for EPG channel mappings
      console.log(`Checking EPG mappings for channel ${channelId} with EPG ID ${channel.epgId}`);
      
      // Get all mappings for this channel across all EPG sources
      const mappings = await db
        .select()
        .from(epgChannelMappings)
        .where(eq(epgChannelMappings.channelId, channelId));
      
      if (mappings.length === 0) {
        console.log(`No EPG mappings found for channel ${channelId}`);
        return [];
      }
      
      // For each mapping, get the programs that match the externalChannelId
      const allPrograms: Program[] = [];
      
      for (const mapping of mappings) {
        console.log(`Checking programs for mapping: Channel ${channelId} -> External ID ${mapping.externalChannelId}`);
        
        // Get all programs where the externalId matches the mapping's externalChannelId
        const mappedPrograms = await db
          .select()
          .from(programs)
          .where(eq(programs.externalId, mapping.externalChannelId));
        
        console.log(`Found ${mappedPrograms.length} programs for external ID ${mapping.externalChannelId}`);
        
        // Add these programs to our result, but change the channelId to match our channel
        const programsWithCorrectChannel = mappedPrograms.map(p => ({
          ...p,
          channelId: channelId
        }));
        
        allPrograms.push(...programsWithCorrectChannel);
      }
      
      console.log(`Returning a total of ${allPrograms.length} programs for channel ${channelId}`);
      return allPrograms;
    } catch (error) {
      console.error("Error getting channel programs:", error);
      return [];
    }
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    // Ensure optional fields have proper defaults
    const programWithDefaults = {
      ...program,
      description: program.description ?? null,
      category: program.category ?? null,
      posterUrl: program.posterUrl ?? null,
      episodeTitle: program.episodeTitle ?? null,
      episodeNumber: program.episodeNumber ?? null,
      season: program.season ?? null,
      year: program.year ?? null,
      director: program.director ?? null,
      cast: program.cast ?? null,
      rating: program.rating ?? null,
      externalId: program.externalId ?? null
    };
    
    const [newProgram] = await db
      .insert(programs)
      .values(programWithDefaults)
      .returning();
    return newProgram;
  }

  async updateProgram(
    id: number,
    programUpdate: Partial<InsertProgram>
  ): Promise<Program | undefined> {
    const [updatedProgram] = await db
      .update(programs)
      .set(programUpdate)
      .where(eq(programs.id, id))
      .returning();
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    try {
      // First check if program exists
      const program = await db
        .select()
        .from(programs)
        .where(eq(programs.id, id))
        .then(rows => rows[0]);
        
      if (!program) {
        return false;
      }
      
      // Delete the program
      const result = await db
        .delete(programs)
        .where(eq(programs.id, id))
        .returning({ id: programs.id });
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting program:", error);
      return false;
    }
  }

  // Movie operations
  async getMovies(): Promise<Movie[]> {
    return await db.select().from(movies);
  }

  async getMovie(id: number): Promise<Movie | undefined> {
    const [movie] = await db
      .select()
      .from(movies)
      .where(eq(movies.id, id));
    return movie;
  }

  async getMoviesByCategory(categoryId: number): Promise<Movie[]> {
    return await db
      .select()
      .from(movies)
      .where(eq(movies.categoryId, categoryId));
  }
  
  async getMoviesByCountry(countryId: number): Promise<Movie[]> {
    return await db
      .select()
      .from(movies)
      .where(eq(movies.countryId, countryId));
  }

  async createMovie(movie: InsertMovie): Promise<Movie> {
    const [newMovie] = await db
      .insert(movies)
      .values(movie)
      .returning();
    return newMovie;
  }

  async updateMovie(
    id: number,
    movieUpdate: Partial<InsertMovie>
  ): Promise<Movie | undefined> {
    const [updatedMovie] = await db
      .update(movies)
      .set(movieUpdate)
      .where(eq(movies.id, id))
      .returning();
    return updatedMovie;
  }

  async deleteMovie(id: number): Promise<boolean> {
    try {
      // First check if movie exists
      const movie = await this.getMovie(id);
      if (!movie) {
        return false;
      }
      
      // Delete the movie
      const result = await db
        .delete(movies)
        .where(eq(movies.id, id))
        .returning({ id: movies.id });
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting movie:", error);
      return false;
    }
  }

  // Series operations
  async getAllSeries(): Promise<Series[]> {
    return await db.select().from(series);
  }

  async getSeries(id: number): Promise<Series | undefined> {
    const [seriesItem] = await db
      .select()
      .from(series)
      .where(eq(series.id, id));
    return seriesItem;
  }

  async getSeriesByCategory(categoryId: number): Promise<Series[]> {
    return await db
      .select()
      .from(series)
      .where(eq(series.categoryId, categoryId));
  }
  
  async getSeriesByCountry(countryId: number): Promise<Series[]> {
    return await db
      .select()
      .from(series)
      .where(eq(series.countryId, countryId));
  }

  async createSeries(seriesData: InsertSeries): Promise<Series> {
    const [newSeries] = await db
      .insert(series)
      .values(seriesData)
      .returning();
    return newSeries;
  }

  async updateSeries(
    id: number,
    seriesUpdate: Partial<InsertSeries>
  ): Promise<Series | undefined> {
    const [updatedSeries] = await db
      .update(series)
      .set(seriesUpdate)
      .where(eq(series.id, id))
      .returning();
    return updatedSeries;
  }

  async deleteSeries(id: number): Promise<boolean> {
    try {
      // First check if series exists
      const seriesItem = await this.getSeries(id);
      if (!seriesItem) {
        return false;
      }
      
      // First delete all episodes associated with this series
      await db
        .delete(episodes)
        .where(eq(episodes.seriesId, id));
        
      // Then delete the series
      const result = await db
        .delete(series)
        .where(eq(series.id, id))
        .returning({ id: series.id });
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting series:", error);
      return false;
    }
  }

  // Episode operations
  async getEpisodes(seriesId: number): Promise<Episode[]> {
    return await db
      .select()
      .from(episodes)
      .where(eq(episodes.seriesId, seriesId));
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db
      .select()
      .from(episodes)
      .where(eq(episodes.id, id));
    return episode;
  }

  async createEpisode(episode: InsertEpisode): Promise<Episode> {
    const [newEpisode] = await db
      .insert(episodes)
      .values(episode)
      .returning();
    return newEpisode;
  }

  async updateEpisode(
    id: number,
    episodeUpdate: Partial<InsertEpisode>
  ): Promise<Episode | undefined> {
    const [updatedEpisode] = await db
      .update(episodes)
      .set(episodeUpdate)
      .where(eq(episodes.id, id))
      .returning();
    return updatedEpisode;
  }

  async deleteEpisode(id: number): Promise<boolean> {
    try {
      // First check if episode exists
      const episode = await this.getEpisode(id);
      if (!episode) {
        return false;
      }
      
      // Delete the episode
      const result = await db
        .delete(episodes)
        .where(eq(episodes.id, id))
        .returning({ id: episodes.id });
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting episode:", error);
      return false;
    }
  }
  
  // EPG operations
  async getEPGSources(): Promise<EPGSource[]> {
    return await db.select().from(epgSources);
  }
  
  async getEPGSource(id: number): Promise<EPGSource | undefined> {
    const [source] = await db.select().from(epgSources).where(eq(epgSources.id, id));
    return source;
  }
  
  async createEPGSource(source: InsertEPGSource): Promise<EPGSource> {
    const [newSource] = await db.insert(epgSources).values({
      ...source,
      channelCount: 0,
      lastUpdate: new Date()
    }).returning();
    return newSource;
  }
  
  async updateEPGSource(id: number, sourceUpdate: Partial<InsertEPGSource>): Promise<EPGSource | undefined> {
    const [updatedSource] = await db
      .update(epgSources)
      .set(sourceUpdate)
      .where(eq(epgSources.id, id))
      .returning();
    return updatedSource;
  }
  
  async deleteEPGSource(id: number): Promise<boolean> {
    try {
      const source = await this.getEPGSource(id);
      if (!source) {
        return false;
      }
      
      const result = await db
        .delete(epgSources)
        .where(eq(epgSources.id, id))
        .returning({ id: epgSources.id });
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting EPG source:", error);
      return false;
    }
  }
  
  async refreshEPGSource(id: number): Promise<EPGSource | undefined> {
    const [updatedSource] = await db
      .update(epgSources)
      .set({ lastUpdate: new Date() })
      .where(eq(epgSources.id, id))
      .returning();
    return updatedSource;
  }

  // EPG Channel Mapping operations
  async getEPGChannelMappings(epgSourceId?: number): Promise<EPGChannelMapping[]> {
    if (epgSourceId) {
      return db.select().from(epgChannelMappings).where(eq(epgChannelMappings.epgSourceId, epgSourceId));
    }
    return db.select().from(epgChannelMappings);
  }

  async getEPGChannelMapping(id: number): Promise<EPGChannelMapping | undefined> {
    const [mapping] = await db.select().from(epgChannelMappings).where(eq(epgChannelMappings.id, id));
    return mapping;
  }

  async getChannelEPGMapping(channelId: number, epgSourceId: number): Promise<EPGChannelMapping | undefined> {
    const [mapping] = await db
      .select()
      .from(epgChannelMappings)
      .where(
        and(
          eq(epgChannelMappings.channelId, channelId),
          eq(epgChannelMappings.epgSourceId, epgSourceId)
        )
      );
    return mapping;
  }

  async createEPGChannelMapping(mapping: InsertEPGChannelMapping): Promise<EPGChannelMapping> {
    const [newMapping] = await db
      .insert(epgChannelMappings)
      .values(mapping)
      .returning();
    return newMapping;
  }

  async updateEPGChannelMapping(id: number, mappingUpdate: Partial<InsertEPGChannelMapping>): Promise<EPGChannelMapping | undefined> {
    const [updatedMapping] = await db
      .update(epgChannelMappings)
      .set(mappingUpdate)
      .where(eq(epgChannelMappings.id, id))
      .returning();
    return updatedMapping;
  }

  async deleteEPGChannelMapping(id: number): Promise<boolean> {
    const result = await db
      .delete(epgChannelMappings)
      .where(eq(epgChannelMappings.id, id));
    return result.rowCount > 0;
  }

  // EPG Import Job operations
  async getEPGImportJobs(epgSourceId?: number): Promise<EPGImportJob[]> {
    if (epgSourceId) {
      return db
        .select()
        .from(epgImportJobs)
        .where(eq(epgImportJobs.epgSourceId, epgSourceId))
        .orderBy(desc(epgImportJobs.startTime));
    }
    return db
      .select()
      .from(epgImportJobs)
      .orderBy(desc(epgImportJobs.startTime));
  }

  async getEPGImportJob(id: number): Promise<EPGImportJob | undefined> {
    const [job] = await db.select().from(epgImportJobs).where(eq(epgImportJobs.id, id));
    return job;
  }

  async createEPGImportJob(job: InsertEPGImportJob): Promise<EPGImportJob> {
    const [newJob] = await db
      .insert(epgImportJobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateEPGImportJob(id: number, jobUpdate: Partial<InsertEPGImportJob>): Promise<EPGImportJob | undefined> {
    const [updatedJob] = await db
      .update(epgImportJobs)
      .set(jobUpdate)
      .where(eq(epgImportJobs.id, id))
      .returning();
    return updatedJob;
  }

  async deleteEPGImportJob(id: number): Promise<boolean> {
    const result = await db
      .delete(epgImportJobs)
      .where(eq(epgImportJobs.id, id));
    return result.rowCount > 0;
  }
  
  // Crypto Payment operations
  async getCryptoPayment(id: number): Promise<CryptoPayment | undefined> {
    const [payment] = await db
      .select()
      .from(cryptoPayments)
      .where(eq(cryptoPayments.id, id));
    return payment;
  }
  
  async getCryptoPaymentsByUserId(userId: number): Promise<CryptoPayment[]> {
    return await db
      .select()
      .from(cryptoPayments)
      .where(eq(cryptoPayments.userId, userId));
  }
  
  async createCryptoPayment(payment: InsertCryptoPayment): Promise<CryptoPayment> {
    const [newPayment] = await db
      .insert(cryptoPayments)
      .values(payment)
      .returning();
    return newPayment;
  }
  
  async updateCryptoPayment(id: number, paymentUpdate: Partial<CryptoPayment>): Promise<CryptoPayment | undefined> {
    const [updatedPayment] = await db
      .update(cryptoPayments)
      .set(paymentUpdate)
      .where(eq(cryptoPayments.id, id))
      .returning();
    return updatedPayment;
  }
  
  async getPendingCryptoPayments(): Promise<CryptoPayment[]> {
    const now = new Date();
    return await db
      .select()
      .from(cryptoPayments)
      .where(
        and(
          eq(cryptoPayments.status, 'pending'),
          gte(cryptoPayments.expiresAt, now)
        )
      );
  }
  
  // User subscription operations
  async updateUserSubscription(userId: number, subscription: { isPremium: boolean; premiumTier?: string; premiumExpiresAt?: Date }): Promise<User> {
    // Get the user first to confirm it exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Use a direct SQL query as a workaround for updating custom fields
    await db.execute(sql`
      UPDATE users 
      SET 
        is_premium = ${subscription.isPremium}, 
        premium_plan = ${subscription.premiumTier || null}, 
        premium_expiry = ${subscription.premiumExpiresAt || null}
      WHERE id = ${userId}
    `);
    
    // Get the updated user
    const updatedUser = await this.getUser(userId);
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found after update`);
    }
    
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User> {
    // Get the user first to confirm it exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Use a direct SQL query to update Stripe-related fields
    await db.execute(sql`
      UPDATE users 
      SET 
        stripe_customer_id = ${stripeInfo.stripeCustomerId || null}, 
        stripe_subscription_id = ${stripeInfo.stripeSubscriptionId || null}
      WHERE id = ${userId}
    `);
    
    // Get the updated user
    const updatedUser = await this.getUser(userId);
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found after update`);
    }
    
    return updatedUser;
  }
  
  async checkUserPremiumStatus(userId: number): Promise<{ isPremium: boolean; planName: string | null; expiryDate: Date | null }> {
    // Get the user record
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Check if user has premium flag
    if (!user.isPremium) {
      return {
        isPremium: false,
        planName: null,
        expiryDate: null
      };
    }
    
    // Check for expiration
    const now = new Date();
    const expiryDate = user.premiumExpiry;
    const isExpired = expiryDate && expiryDate < now;
    
    // If premium has expired, update the user record
    if (isExpired) {
      await this.updateUserSubscription(userId, {
        isPremium: false,
        premiumTier: null,
        premiumExpiresAt: null
      });
      
      return {
        isPremium: false,
        planName: null,
        expiryDate: null
      };
    }
    
    // Premium is active
    return {
      isPremium: true,
      planName: user.premiumPlan,
      expiryDate: user.premiumExpiry
    };
  }
  
  // Stream Analytics operations
  async recordStreamAnalytics(analytics: InsertStreamAnalytics): Promise<StreamAnalytics> {
    const [record] = await db.insert(streamAnalytics).values(analytics).returning();
    return record;
  }
  
  async getStreamAnalytics(userId?: number, contentType?: string, contentId?: number): Promise<StreamAnalytics[]> {
    let query = db.select().from(streamAnalytics);
    
    if (userId !== undefined) {
      query = query.where(eq(streamAnalytics.userId, userId));
    }
    
    if (contentType !== undefined) {
      query = query.where(eq(streamAnalytics.contentType, contentType));
    }
    
    if (contentId !== undefined) {
      query = query.where(eq(streamAnalytics.contentId, contentId));
    }
    
    const records = await query.orderBy(desc(streamAnalytics.timestamp));
    return records;
  }
  
  async getStreamAnalyticsByEvent(event: string): Promise<StreamAnalytics[]> {
    const records = await db.select()
      .from(streamAnalytics)
      .where(eq(streamAnalytics.event, event))
      .orderBy(desc(streamAnalytics.timestamp));
    
    return records;
  }
  
  async getLatestStreamEvent(userId: number, contentType: string, contentId: number, event: string): Promise<StreamAnalytics | undefined> {
    const [record] = await db.select()
      .from(streamAnalytics)
      .where(
        and(
          eq(streamAnalytics.userId, userId),
          eq(streamAnalytics.contentType, contentType),
          eq(streamAnalytics.contentId, contentId),
          eq(streamAnalytics.event, event)
        )
      )
      .orderBy(desc(streamAnalytics.timestamp))
      .limit(1);
    
    return record;
  }
  
  async getStreamQualityStats(userId?: number): Promise<{ quality: string; count: number }[]> {
    let query = sql`
      SELECT quality, COUNT(*) as count
      FROM ${streamAnalytics}
      WHERE quality IS NOT NULL
    `;
    
    if (userId !== undefined) {
      query = sql`
        SELECT quality, COUNT(*) as count
        FROM ${streamAnalytics}
        WHERE quality IS NOT NULL AND user_id = ${userId}
      `;
    }
    
    query = sql`${query} GROUP BY quality`;
    
    const result = await db.execute(query);
    return result.rows.map(row => ({
      quality: row.quality as string,
      count: Number(row.count)
    }));
  }
  
  async getStreamBufferingStats(userId?: number, days: number = 7): Promise<{ date: string; avgBufferingMs: number; count: number }[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let query = sql`
      SELECT 
        DATE(timestamp) as date, 
        AVG(buffering_duration) as avg_buffering_ms,
        COUNT(*) as count
      FROM ${streamAnalytics}
      WHERE 
        event = 'buffering' 
        AND timestamp >= ${cutoffDate} 
        AND buffering_duration IS NOT NULL
    `;
    
    if (userId !== undefined) {
      query = sql`
        SELECT 
          DATE(timestamp) as date, 
          AVG(buffering_duration) as avg_buffering_ms,
          COUNT(*) as count
        FROM ${streamAnalytics}
        WHERE 
          event = 'buffering' 
          AND timestamp >= ${cutoffDate} 
          AND buffering_duration IS NOT NULL
          AND user_id = ${userId}
      `;
    }
    
    query = sql`${query} GROUP BY DATE(timestamp) ORDER BY date ASC`;
    
    const result = await db.execute(query);
    return result.rows.map(row => ({
      date: row.date as string,
      avgBufferingMs: Math.round(Number(row.avg_buffering_ms)),
      count: Number(row.count)
    }));
  }
  
  // Stream Token operations
  async createActiveStreamToken(token: InsertActiveStreamToken): Promise<ActiveStreamToken> {
    const [newToken] = await db.insert(activeStreamTokens).values(token).returning();
    return newToken;
  }
  
  async getActiveStreamToken(tokenId: string): Promise<ActiveStreamToken | undefined> {
    const [token] = await db.select()
      .from(activeStreamTokens)
      .where(eq(activeStreamTokens.tokenId, tokenId));
    
    return token;
  }
  
  async revokeStreamToken(tokenId: string): Promise<boolean> {
    const result = await db.delete(activeStreamTokens)
      .where(eq(activeStreamTokens.tokenId, tokenId));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async rotateStreamToken(tokenId: string, newTokenId: string): Promise<ActiveStreamToken | undefined> {
    // First, get the old token
    const [oldToken] = await db.select()
      .from(activeStreamTokens)
      .where(eq(activeStreamTokens.tokenId, tokenId));
    
    if (!oldToken) return undefined;
    
    const now = new Date();
    
    // Start a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Delete the old token
      await tx.delete(activeStreamTokens)
        .where(eq(activeStreamTokens.tokenId, tokenId));
      
      // Create a new token with the new ID but retain other properties
      const [newToken] = await tx.insert(activeStreamTokens)
        .values({
          ...oldToken,
          tokenId: newTokenId,
          issuedAt: now,
          lastAccessed: now
        })
        .returning();
      
      return newToken;
    });
  }
  
  async getUserActiveStreamTokens(userId: number): Promise<ActiveStreamToken[]> {
    const tokens = await db.select()
      .from(activeStreamTokens)
      .where(eq(activeStreamTokens.userId, userId))
      .orderBy(desc(activeStreamTokens.lastAccessed));
    
    return tokens;
  }
  
  async cleanupExpiredStreamTokens(): Promise<number> {
    const now = new Date();
    const result = await db.delete(activeStreamTokens)
      .where(
        lte(activeStreamTokens.expiresAt, now)
      );
    
    return result.rowCount ? result.rowCount : 0;
  }
  
  // Geographic Restrictions operations
  async createGeoRestriction(restriction: InsertGeoRestriction): Promise<GeoRestriction> {
    const [newRestriction] = await db.insert(geoRestrictions).values(restriction).returning();
    return newRestriction;
  }
  
  async getGeoRestriction(id: number): Promise<GeoRestriction | undefined> {
    const [restriction] = await db.select()
      .from(geoRestrictions)
      .where(eq(geoRestrictions.id, id));
    
    return restriction;
  }
  
  async getGeoRestrictionForContent(contentType: string, contentId: number): Promise<GeoRestriction | undefined> {
    const [restriction] = await db.select()
      .from(geoRestrictions)
      .where(
        and(
          eq(geoRestrictions.contentType, contentType),
          eq(geoRestrictions.contentId, contentId)
        )
      );
    
    return restriction;
  }
  
  async updateGeoRestriction(id: number, restriction: Partial<InsertGeoRestriction>): Promise<GeoRestriction | undefined> {
    const [updatedRestriction] = await db.update(geoRestrictions)
      .set(restriction)
      .where(eq(geoRestrictions.id, id))
      .returning();
    
    return updatedRestriction;
  }
  
  async deleteGeoRestriction(id: number): Promise<boolean> {
    const result = await db.delete(geoRestrictions)
      .where(eq(geoRestrictions.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  async checkGeoRestriction(contentType: string, contentId: number, countryCode: string): Promise<boolean> {
    const restriction = await this.getGeoRestrictionForContent(contentType, contentId);
    
    if (!restriction) {
      // No restrictions, content is allowed
      return true;
    }
    
    // Check if country code is in the array of country codes
    const countryCodes = restriction.countryCodes as string[];
    const countryInList = countryCodes.includes(countryCode);
    
    if (restriction.restrictionType === 'whitelist') {
      // Whitelist mode - only allowed countries can access
      return countryInList;
    } else {
      // Blacklist mode - all countries except restricted ones can access
      return !countryInList;
    }
  }
  
  // DRM & encryption operations
  async getDRMKeyForContent(contentType: string, contentId: number): Promise<string | null> {
    // This would connect to a DRM key server or database - for now just return null
    return null;
  }
}

// Use database storage
export const storage = new DatabaseStorage();
