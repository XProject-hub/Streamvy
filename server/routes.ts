import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { setupAuth } from "./auth";
import { storage, MemStorage } from "./storage";
import { epgService } from "./epg-service";
import { webgrabService } from "./utils/webgrab-service";
import cryptoPaymentsRoutes from "./routes/crypto-payments";
import ppvRoutes from "./routes/ppv-routes";
import userPreferencesRoutes from "./routes/user-preferences";
import watchHistoryRoutes from "./routes/watch-history";
import streamRoutes from "./routes/stream-routes";
import analyticsRoutes from "./routes/analytics-routes";

import axios from "axios";
import {
  insertCategorySchema,
  insertCountrySchema,
  insertChannelSchema,
  insertProgramSchema,
  insertMovieSchema,
  insertSeriesSchema,
  insertEpisodeSchema,
  insertWatchHistorySchema,
  insertUserPreferencesSchema,
  insertSiteSettingsSchema,
  insertEPGSourceSchema,
  insertEPGChannelMappingSchema,
  insertEPGImportJobSchema
} from "@shared/schema";

// Admin middleware to check if user is an admin
const ensureAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Unauthorized. Admin access required." });
  }
  next();
};

// Premium middleware to check if user has active premium subscription
const ensurePremium = async (req: Request, res: Response, next: Function) => {
  try {
    // First check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
    
    const userId = req.user!.id;
    
    // Check premium status
    const premiumStatus = await storage.checkUserPremiumStatus(userId);
    
    if (!premiumStatus.isPremium) {
      // Check if it was expired
      if (premiumStatus.expiryDate && premiumStatus.expiryDate < new Date()) {
        return res.status(402).json({ 
          message: "Premium subscription expired",
          expired: true,
          subscriptionRequired: true
        });
      }
      
      // No subscription
      return res.status(402).json({ 
        message: "Premium subscription required to access this content",
        expired: false,
        subscriptionRequired: true
      });
    }
    
    // User has valid premium subscription
    next();
  } catch (error) {
    console.error("Error checking premium status:", error);
    return res.status(500).json({ message: "Error checking premium status" });
  }
};

// Define the EPG source schema to validate requests
const epgSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  description: z.string().optional(),
});

// Function to discover EPG sources based on country code
async function discoverEPGSources(countryCode: string): Promise<Array<{name: string, url: string, description: string}>> {
  // Common EPG source patterns by country with updated URLs
  const commonPatterns = {
    // European sources
    'uk': [
      { name: 'UK - XMLTV.co.uk', url: 'https://xmltv.co.uk/feed/tv.xml', description: 'Free UK TV listings' },
      { name: 'UK - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/uk/sky.com.epg.xml', description: 'UK TV guide from IPTV-ORG' }
    ],
    'de': [
      { name: 'Germany - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/de/magentatv.de.epg.xml', description: 'German TV programs' },
      { name: 'Germany - Zattoo', url: 'https://iptv-org.github.io/epg/guides/de/zattoo.com.epg.xml', description: 'German TV from Zattoo' }
    ],
    'fr': [
      { name: 'France - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/fr/telecablesat.fr.epg.xml', description: 'French TV listings' },
      { name: 'France - Telerama', url: 'https://iptv-org.github.io/epg/guides/fr/telerama.fr.epg.xml', description: 'French TV from Telerama' }
    ],
    'it': [
      { name: 'Italy - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/it/guidatv.sky.it.epg.xml', description: 'Italian TV guide' },
      { name: 'Italy - Mediaset', url: 'https://iptv-org.github.io/epg/guides/it/mediaset.it.epg.xml', description: 'Italian TV from Mediaset' }
    ],
    'es': [
      { name: 'Spain - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/es/gatotv.com.epg.xml', description: 'Spanish TV listings' },
      { name: 'Spain - Movistar', url: 'https://iptv-org.github.io/epg/guides/es/movistarplus.es.epg.xml', description: 'Spanish TV from Movistar' }
    ],
    
    // North America
    'us': [
      { name: 'USA - XMLTV.net', url: 'http://xmltv.net/xml_files/TV_Listings.xml', description: 'US TV listings' },
      { name: 'USA - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/us/tvguide.com.epg.xml', description: 'American TV guide from IPTV-ORG' },
      { name: 'USA - DirecTV', url: 'https://iptv-org.github.io/epg/guides/us/directv.com.epg.xml', description: 'US TV from DirecTV' }
    ],
    'ca': [
      { name: 'Canada - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/ca/tvtv.us.epg.xml', description: 'Canadian TV listings' },
      { name: 'Canada - Bell', url: 'https://iptv-org.github.io/epg/guides/ca/bell.ca.epg.xml', description: 'Canadian TV from Bell' }
    ],
    
    // Asia-Pacific
    'au': [
      { name: 'Australia - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/au/ontvtonight.com.epg.xml', description: 'Australian TV guide' }
    ],
    'jp': [
      { name: 'Japan - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/jp/tvguide.myjcom.jp.epg.xml', description: 'Japanese TV listings' }
    ],
    
    // Middle East
    'ae': [
      { name: 'UAE - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/ae/osn.com.epg.xml', description: 'UAE TV listings' }
    ],
    
    // Custom for Turkey - Updated with working sources
    'tr': [
      { name: 'Turkey - Digiturk', url: 'https://iptv-org.github.io/epg/guides/tr/digiturk.com.tr.epg.xml', description: 'Turkish TV guide from Digiturk' },
      { name: 'Turkey - TV24', url: 'https://iptv-org.github.io/epg/guides/tr/tv24.com.tr.epg.xml', description: 'Turkish TV from TV24' },
      { name: 'Turkey - D-Smart', url: 'https://iptv-org.github.io/epg/guides/tr/dsmart.com.tr.epg.xml', description: 'Turkish TV from D-Smart' }
    ],
    
    // General sources for all countries
    'all': [
      { name: 'International - IPTV-ORG Index', url: 'https://iptv-org.github.io/epg/index.html', description: 'Guide to all available EPG sources from IPTV-ORG' },
      { name: 'Global - EPG Grabber', url: 'https://github.com/iptv-org/epg', description: 'Repository of Electronic Program Guide from different IPTV providers' }
    ]
  };
  
  // Return country-specific sources if available, otherwise return general sources
  if (countryCode in commonPatterns) {
    return commonPatterns[countryCode as keyof typeof commonPatterns];
  } else {
    return [
      ...commonPatterns['all'],
      { 
        name: `${countryCode.toUpperCase()} - IPTV-ORG`, 
        url: `https://iptv-org.github.io/epg/guides/${countryCode.toLowerCase()}/tvguide.com.epg.xml`, 
        description: `Auto-generated IPTV-ORG URL for ${countryCode.toUpperCase()} EPG sources` 
      }
    ];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Testing route to delete all users
  app.post("/api/clear-users", async (req, res) => {
    try {
      // For consistency with our approach, we'll avoid direct property access
      return res.status(501).json({ message: "Clear users not implemented" });
    } catch (error) {
      console.error("Error clearing users:", error);
      return res.status(500).json({ message: "Failed to clear users" });
    }
  });

  // Special route to create admin user - this should come BEFORE auth setup
  app.post("/api/setup-admin", async (req, res) => {
    try {
      // Check if admin already exists
      const existingAdmin = await storage.getUserByUsername("admin");
      
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin user already exists" });
      }
      
      // Create a new admin user with password "password"
      const hashedPassword = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.dddddddddddddddddddddddddddddddd";
      
      const admin = await storage.createUser({
        username: "admin",
        password: hashedPassword,
        isAdmin: true
      });
      
      // Remove password from response
      const { password, ...adminWithoutPassword } = admin;
      
      return res.status(201).json({
        message: "Admin user created successfully. Username: admin, Password: password",
        user: adminWithoutPassword
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      return res.status(500).json({ message: "Failed to create admin user" });
    }
  });
  
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Public API routes
  
  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });
  
  // Countries
  app.get("/api/countries", async (_req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      res.status(500).json({ message: "Failed to get countries" });
    }
  });
  
  // Channels
  app.get("/api/channels", async (_req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to get channels" });
    }
  });
  
  app.get("/api/channels/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const channels = await storage.getChannelsByCategory(categoryId);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to get channels by category" });
    }
  });
  
  app.get("/api/channels/country/:countryId", async (req, res) => {
    try {
      const countryId = parseInt(req.params.countryId);
      if (isNaN(countryId)) {
        return res.status(400).json({ message: "Invalid country ID" });
      }
      
      const channels = await storage.getChannelsByCountry(countryId);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to get channels by country" });
    }
  });
  
  app.get("/api/channels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }
      
      const channel = await storage.getChannel(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      res.json(channel);
    } catch (error) {
      res.status(500).json({ message: "Failed to get channel" });
    }
  });
  
  // Programs
  app.get("/api/programs/current", async (_req, res) => {
    try {
      const programs = await storage.getCurrentPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get current programs" });
    }
  });
  
  app.get("/api/channels/:channelId/programs", async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }
      
      const programs = await storage.getChannelPrograms(channelId);
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get channel programs" });
    }
  });
  
  // Movies
  app.get("/api/movies", async (_req, res) => {
    try {
      const movies = await storage.getMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies:", error);
      res.status(500).json({ message: "Failed to get movies" });
    }
  });
  
  app.get("/api/movies/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const movies = await storage.getMoviesByCategory(categoryId);
      res.json(movies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get movies by category" });
    }
  });
  
  app.get("/api/movies/country/:countryId", async (req, res) => {
    try {
      const countryId = parseInt(req.params.countryId);
      if (isNaN(countryId)) {
        return res.status(400).json({ message: "Invalid country ID" });
      }
      
      const movies = await storage.getMoviesByCountry(countryId);
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies by country:", error);
      res.status(500).json({ message: "Failed to get movies by country" });
    }
  });
  
  app.get("/api/movies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movie = await storage.getMovie(id);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.json(movie);
    } catch (error) {
      res.status(500).json({ message: "Failed to get movie" });
    }
  });
  
  // Series
  app.get("/api/series", async (_req, res) => {
    try {
      const series = await storage.getAllSeries();
      res.json(series);
    } catch (error) {
      console.error("Error fetching series:", error);
      res.status(500).json({ message: "Failed to get series" });
    }
  });
  
  app.get("/api/series/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const series = await storage.getSeriesByCategory(categoryId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching series by category:", error);
      res.status(500).json({ message: "Failed to get series by category" });
    }
  });
  
  app.get("/api/series/country/:countryId", async (req, res) => {
    try {
      const countryId = parseInt(req.params.countryId);
      if (isNaN(countryId)) {
        return res.status(400).json({ message: "Invalid country ID" });
      }
      
      const series = await storage.getSeriesByCountry(countryId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching series by country:", error);
      res.status(500).json({ message: "Failed to get series by country" });
    }
  });
  
  app.get("/api/series/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid series ID" });
      }
      
      const series = await storage.getSeries(id);
      if (!series) {
        return res.status(404).json({ message: "Series not found" });
      }
      
      res.json(series);
    } catch (error) {
      res.status(500).json({ message: "Failed to get series" });
    }
  });
  
  app.get("/api/series/:seriesId/episodes", async (req, res) => {
    try {
      const seriesId = parseInt(req.params.seriesId);
      if (isNaN(seriesId)) {
        return res.status(400).json({ message: "Invalid series ID" });
      }
      
      const episodes = await storage.getEpisodes(seriesId);
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get episodes" });
    }
  });
  
  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid episode ID" });
      }
      
      const episode = await storage.getEpisode(id);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      res.json(episode);
    } catch (error) {
      res.status(500).json({ message: "Failed to get episode" });
    }
  });
  
  // Admin API routes
  
  // Categories Management
  app.post("/api/admin/categories", ensureAdmin, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  app.put("/api/admin/categories/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.updateCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  app.delete("/api/admin/categories/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  
  // Countries Management
  app.post("/api/admin/countries", ensureAdmin, async (req, res) => {
    try {
      const country = await storage.createCountry(req.body);
      res.status(201).json(country);
    } catch (error) {
      res.status(500).json({ message: "Failed to create country" });
    }
  });
  
  app.put("/api/admin/countries/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid country ID" });
      }
      
      const country = await storage.updateCountry(id, req.body);
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }
      
      res.json(country);
    } catch (error) {
      res.status(500).json({ message: "Failed to update country" });
    }
  });
  
  app.delete("/api/admin/countries/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid country ID" });
      }
      
      const deleted = await storage.deleteCountry(id);
      if (!deleted) {
        return res.status(404).json({ message: "Country not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete country" });
    }
  });
  
  // Channels Management
  app.post("/api/admin/channels", ensureAdmin, async (req, res) => {
    try {
      // Create the channel
      const channel = await storage.createChannel(req.body);
      
      // Automatically map the channel to EPG sources
      try {
        console.log(`[Routes] Attempting to auto-map newly created channel ${channel.id} (${channel.name}) to EPG sources`);
        const epgSources = await storage.getEPGSources();
        console.log(`[Routes] Found ${epgSources.length} EPG sources to map the channel to`);
        
        for (const source of epgSources) {
          console.log(`[Routes] Mapping channel ${channel.id} (${channel.name}) to EPG source ${source.id} (${source.name})`);
          // Try to map this channel to this EPG source
          await webgrabService.autoMapChannelToSource(channel.id, source.id);
        }
      } catch (epgError) {
        console.error("[Routes] Error auto-mapping new channel to EPG sources:", epgError);
        // Continue with response, as the channel was created successfully
      }
      
      res.status(201).json(channel);
    } catch (error) {
      res.status(500).json({ message: "Failed to create channel" });
    }
  });
  
  app.put("/api/admin/channels/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }
      
      const channel = await storage.updateChannel(id, req.body);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      // If the channel name was updated, try to update EPG mappings
      if (req.body.name) {
        try {
          console.log(`[Routes] Attempting to update EPG mappings for channel ${channel.id} (${channel.name}) after name change`);
          
          // Get all EPG sources
          const epgSources = await storage.getEPGSources();
          console.log(`[Routes] Found ${epgSources.length} EPG sources to update mappings for`);
          
          // For each source, try to map or update the mapping for this channel
          for (const source of epgSources) {
            console.log(`[Routes] Updating mapping for channel ${channel.id} (${channel.name}) to EPG source ${source.id} (${source.name})`);
            await webgrabService.autoMapChannelToSource(id, source.id);
          }
        } catch (epgError) {
          console.error("[Routes] Error updating EPG mappings for channel:", epgError);
          // Continue with response, as the channel was updated successfully
        }
      }
      
      res.json(channel);
    } catch (error) {
      res.status(500).json({ message: "Failed to update channel" });
    }
  });
  
  app.delete("/api/admin/channels/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }
      
      const deleted = await storage.deleteChannel(id);
      if (!deleted) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete channel" });
    }
  });
  
  // Programs Management
  app.post("/api/admin/programs", ensureAdmin, async (req, res) => {
    try {
      const program = await storage.createProgram(req.body);
      res.status(201).json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to create program" });
    }
  });
  
  app.put("/api/admin/programs/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid program ID" });
      }
      
      const program = await storage.updateProgram(id, req.body);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to update program" });
    }
  });
  
  app.delete("/api/admin/programs/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid program ID" });
      }
      
      const deleted = await storage.deleteProgram(id);
      if (!deleted) {
        return res.status(404).json({ message: "Program not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete program" });
    }
  });
  
  // Movies Management
  app.post("/api/admin/movies", ensureAdmin, async (req, res) => {
    try {
      const movie = await storage.createMovie(req.body);
      res.status(201).json(movie);
    } catch (error) {
      res.status(500).json({ message: "Failed to create movie" });
    }
  });
  
  app.put("/api/admin/movies/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movie = await storage.updateMovie(id, req.body);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.json(movie);
    } catch (error) {
      res.status(500).json({ message: "Failed to update movie" });
    }
  });
  
  app.delete("/api/admin/movies/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const deleted = await storage.deleteMovie(id);
      if (!deleted) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete movie" });
    }
  });
  
  // Series Management
  app.post("/api/admin/series", ensureAdmin, async (req, res) => {
    try {
      const series = await storage.createSeries(req.body);
      res.status(201).json(series);
    } catch (error) {
      res.status(500).json({ message: "Failed to create series" });
    }
  });
  
  app.put("/api/admin/series/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid series ID" });
      }
      
      const series = await storage.updateSeries(id, req.body);
      if (!series) {
        return res.status(404).json({ message: "Series not found" });
      }
      
      res.json(series);
    } catch (error) {
      res.status(500).json({ message: "Failed to update series" });
    }
  });
  
  app.delete("/api/admin/series/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid series ID" });
      }
      
      const deleted = await storage.deleteSeries(id);
      if (!deleted) {
        return res.status(404).json({ message: "Series not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete series" });
    }
  });
  
  // Episodes Management
  app.post("/api/admin/episodes", ensureAdmin, async (req, res) => {
    try {
      const episode = await storage.createEpisode(req.body);
      res.status(201).json(episode);
    } catch (error) {
      res.status(500).json({ message: "Failed to create episode" });
    }
  });
  
  app.put("/api/admin/episodes/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid episode ID" });
      }
      
      const episode = await storage.updateEpisode(id, req.body);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      res.json(episode);
    } catch (error) {
      res.status(500).json({ message: "Failed to update episode" });
    }
  });
  
  app.delete("/api/admin/episodes/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid episode ID" });
      }
      
      const deleted = await storage.deleteEpisode(id);
      if (!deleted) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete episode" });
    }
  });

  // EPG Sources Management
  app.get("/api/admin/epg/sources", ensureAdmin, async (_req, res) => {
    try {
      const sources = await storage.getEPGSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching EPG sources:", error);
      res.status(500).json({ message: "Failed to get EPG sources" });
    }
  });
  
  // EPG Auto-Discover endpoint
  app.get("/api/admin/epg/discover/:countryCode", ensureAdmin, async (req, res) => {
    try {
      const { countryCode } = req.params;
      if (!countryCode || countryCode.length !== 2) {
        return res.status(400).json({ message: "Valid country code required (2 letters)" });
      }
      
      const discoveredSources = await discoverEPGSources(countryCode.toLowerCase());
      res.json(discoveredSources); // Return array directly for easier frontend handling
    } catch (error) {
      console.error("Failed to discover EPG sources:", error);
      res.status(500).json({ message: "Failed to discover EPG sources" });
    }
  });
  
  app.post("/api/admin/epg/sources", ensureAdmin, async (req, res) => {
    try {
      // Parse the body manually to avoid issues with XML URLs
      const { name, url, description } = req.body;
      
      // Validate required fields
      if (!name || !url) {
        return res.status(400).json({ message: "Name and URL are required" });
      }
      
      // Create the EPG source in storage
      const newSource = await storage.createEPGSource({
        name,
        url,
        description: description || null
      });
      
      res.json(newSource);
    } catch (error) {
      console.error("Error creating EPG source:", error);
      res.status(500).json({ message: "Failed to create EPG source: " + (error as Error).message });
    }
  });

  app.put("/api/admin/epg/sources/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid EPG source ID" });
      }

      // Parse the body manually to avoid issues with XML URLs
      const { name, url, description } = req.body;
      
      // Validate required fields
      if (!name || !url) {
        return res.status(400).json({ message: "Name and URL are required" });
      }
      
      // Check if EPG source exists
      const existingSource = await storage.getEPGSource(id);
      if (!existingSource) {
        return res.status(404).json({ message: "EPG source not found" });
      }
      
      // Update EPG source
      const updatedSource = await storage.updateEPGSource(id, {
        name,
        url,
        description: description || null
      });
      
      res.json(updatedSource);
    } catch (error) {
      console.error("Error updating EPG source:", error);
      res.status(500).json({ message: "Failed to update EPG source: " + (error as Error).message });
    }
  });

  app.delete("/api/admin/epg/sources/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid EPG source ID" });
      }
      
      // Check if EPG source exists
      const existingSource = await storage.getEPGSource(id);
      if (!existingSource) {
        return res.status(404).json({ message: "EPG source not found" });
      }
      
      // Delete EPG source
      const deleted = await storage.deleteEPGSource(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete EPG source" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting EPG source:", error);
      res.status(500).json({ message: "Failed to delete EPG source: " + (error as Error).message });
    }
  });

  app.post("/api/admin/epg/sources/:id/refresh", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid EPG source ID" });
      }
      
      // Check if EPG source exists
      const existingSource = await storage.getEPGSource(id);
      if (!existingSource) {
        return res.status(404).json({ message: "EPG source not found" });
      }
      
      // Create a new EPG import job
      const importJob = await storage.createEPGImportJob({
        epgSourceId: id,
        status: 'running',
        startTime: new Date(),
        endTime: null,
        channelCount: 0,
        programCount: 0,
        errorMessage: null
      });
      
      try {
        // Use EPG service to fetch and process EPG data
        const result = await epgService.fetchAndProcessEPG(id);
        
        // Update job with results
        await storage.updateEPGImportJob(importJob.id, {
          status: 'completed',
          endTime: new Date(),
          channelsImported: result.channelsImported || 0,
          programsImported: result.programsImported || 0,
          errors: []
        });
        
        res.json({
          message: "EPG data refreshed successfully",
          source: existingSource,
          job: {
            id: importJob.id,
            status: 'completed',
            channelsImported: result.channelsImported || 0,
            programsImported: result.programsImported || 0
          }
        });
      } catch (fetchError) {
        // Update job with error
        await storage.updateEPGImportJob(importJob.id, {
          status: 'failed',
          endTime: new Date(),
          errors: [(fetchError as Error).message]
        });
        
        throw fetchError;
      }
    } catch (error) {
      console.error("Error refreshing EPG source:", error);
      res.status(500).json({ message: "Failed to refresh EPG data: " + (error as Error).message });
    }
  });

  app.post("/api/admin/epg/upload", ensureAdmin, async (req, res) => {
    try {
      // TODO: Implement file upload handling
      // For now just return a mock response
      
      res.json({ 
        message: "EPG file processed successfully",
        channelsFound: 0,
        programsAdded: 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process EPG file: " + (error as Error).message });
    }
  });
  
  // Generate WebGrab+ configuration file
  app.post("/api/admin/epg/webgrab/config", ensureAdmin, async (req, res) => {
    try {
      const configSchema = z.object({
        siteIni: z.string(),
        channels: z.array(z.object({
          channelId: z.number(),
          displayName: z.string(),
          siteId: z.string()
        })),
        timespan: z.number().min(1).max(14).default(3),
        update: z.enum(['i', 'g', 'f']).default('i')
      });
      
      const validation = configSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid configuration data", 
          errors: validation.error.format() 
        });
      }
      
      const config = validation.data;
      const configXml = await epgService.generateWebGrabConfig(config);
      
      res.json({
        message: "WebGrab+ configuration generated successfully",
        config: configXml
      });
    } catch (error) {
      console.error("Error generating WebGrab+ configuration:", error);
      res.status(500).json({ message: "Failed to generate WebGrab+ configuration: " + (error as Error).message });
    }
  });
  
  // Get available WebGrab+ site configurations
  app.get("/api/admin/epg/webgrab/sites", ensureAdmin, async (_req, res) => {
    try {
      const siteConfigs = await webgrabService.getAvailableSiteConfigs();
      res.json(siteConfigs);
    } catch (error) {
      console.error("Error fetching WebGrab+ site configurations:", error);
      res.status(500).json({ message: "Failed to fetch WebGrab+ site configurations" });
    }
  });
  
  // Execute WebGrab+ for an EPG source
  app.post("/api/admin/epg/webgrab/execute/:sourceId", ensureAdmin, async (req, res) => {
    try {
      const sourceId = parseInt(req.params.sourceId);
      if (isNaN(sourceId)) {
        return res.status(400).json({ message: "Invalid EPG source ID" });
      }
      
      // Check if EPG source exists
      const existingSource = await storage.getEPGSource(sourceId);
      if (!existingSource) {
        return res.status(404).json({ message: "EPG source not found" });
      }
      
      const configSchema = z.object({
        filename: z.string().default("guide.xml"),
        mode: z.enum(['i', 'g', 'f']).default('i'),
        timespan: z.number().min(1).max(14).default(3),
        siteIniConfigs: z.array(z.object({
          id: z.string(),
          name: z.string(),
          url: z.string()
        })),
        selectedChannels: z.array(z.object({
          channelId: z.number(),
          displayName: z.string(),
          siteId: z.string(),
          siteIniId: z.string()
        }))
      });
      
      const validation = configSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid WebGrab+ configuration", 
          errors: validation.error.format() 
        });
      }
      
      // Generate WebGrab+ configuration
      const configPath = await webgrabService.generateConfig(validation.data);
      
      // Execute WebGrab+
      const result = await webgrabService.executeWebGrab(sourceId, configPath);
      
      if (result.success) {
        res.json({
          message: result.message,
          success: true,
          sourceId,
          outputFile: result.outputFile
        });
      } else {
        res.status(500).json({
          message: result.message,
          success: false,
          sourceId
        });
      }
    } catch (error) {
      console.error("Error executing WebGrab+:", error);
      res.status(500).json({ message: "Failed to execute WebGrab+: " + (error as Error).message });
    }
  });
  
  // Channel mappings
  app.get("/api/admin/epg/channel-mappings", ensureAdmin, async (_req, res) => {
    try {
      const mappings = await storage.getEPGChannelMappings();
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching EPG channel mappings:", error);
      res.status(500).json({ message: "Failed to get EPG channel mappings" });
    }
  });
  
  app.post("/api/admin/epg/channel-mappings", ensureAdmin, async (req, res) => {
    try {
      const mapping = await storage.createEPGChannelMapping(req.body);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating EPG channel mapping:", error);
      res.status(500).json({ message: "Failed to create EPG channel mapping" });
    }
  });
  
  app.put("/api/admin/epg/channel-mappings/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }
      
      const mapping = await storage.updateEPGChannelMapping(id, req.body);
      if (!mapping) {
        return res.status(404).json({ message: "EPG channel mapping not found" });
      }
      
      res.json(mapping);
    } catch (error) {
      console.error("Error updating EPG channel mapping:", error);
      res.status(500).json({ message: "Failed to update EPG channel mapping" });
    }
  });
  
  app.delete("/api/admin/epg/channel-mappings/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mapping ID" });
      }
      
      const deleted = await storage.deleteEPGChannelMapping(id);
      if (!deleted) {
        return res.status(404).json({ message: "EPG channel mapping not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting EPG channel mapping:", error);
      res.status(500).json({ message: "Failed to delete EPG channel mapping" });
    }
  });
  
  // Auto-map EPG channels by name
  app.post("/api/admin/epg/auto-map/:sourceId", ensureAdmin, async (req, res) => {
    try {
      const sourceId = parseInt(req.params.sourceId);
      if (isNaN(sourceId)) {
        return res.status(400).json({ message: "Invalid EPG source ID" });
      }
      
      // Check if EPG source exists
      const existingSource = await storage.getEPGSource(sourceId);
      if (!existingSource) {
        return res.status(404).json({ message: "EPG source not found" });
      }
      
      // Call the WebGrab service to perform auto-mapping
      const mappingsCreated = await webgrabService.autoMapChannelsByName(sourceId);
      
      res.json({
        success: true,
        message: `Successfully mapped ${mappingsCreated} channels by name`,
        mappingsCreated
      });
    } catch (error) {
      console.error("Error auto-mapping EPG channels:", error);
      res.status(500).json({ message: "Failed to auto-map EPG channels" });
    }
  });
  
  // Auto-map a specific channel by name
  app.post("/api/admin/epg/map-channel", ensureAdmin, async (req, res) => {
    try {
      const { channelId, sourceId, channelName } = req.body;
      
      if (!channelId || !sourceId) {
        return res.status(400).json({ message: "Channel ID and source ID are required" });
      }
      
      // Check if channel exists
      const channel = await storage.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      // Check if EPG source exists
      const source = await storage.getEPGSource(sourceId);
      if (!source) {
        return res.status(404).json({ message: "EPG source not found" });
      }
      
      // Create a mapping with an external channel ID based on the channel name
      const externalName = channelName || channel.name;
      const externalId = externalName.toLowerCase().replace(/\s+/g, '');
      
      // Check if mapping already exists
      const existingMappings = await storage.getEPGChannelMappings(sourceId);
      const existingMapping = existingMappings.find(m => 
        m.channelId === channelId && m.epgSourceId === sourceId
      );
      
      if (existingMapping) {
        // Update existing mapping
        const updatedMapping = await storage.updateEPGChannelMapping(existingMapping.id, {
          externalChannelId: externalId,
          externalChannelName: externalName,
          isActive: true
        });
        
        return res.json({
          success: true,
          message: "Updated existing channel mapping",
          mapping: updatedMapping
        });
      }
      
      // Create new mapping
      const mapping = await storage.createEPGChannelMapping({
        channelId,
        epgSourceId: sourceId,
        externalChannelId: externalId,
        externalChannelName: externalName,
        isActive: true
      });
      
      res.status(201).json({
        success: true,
        message: "Successfully mapped channel by name",
        mapping
      });
    } catch (error) {
      console.error("Error mapping channel:", error);
      res.status(500).json({ message: "Failed to map channel" });
    }
  });
  
  // EPG Import Jobs
  app.get("/api/admin/epg/import-jobs", ensureAdmin, async (_req, res) => {
    try {
      const jobs = await storage.getEPGImportJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching EPG import jobs:", error);
      res.status(500).json({ message: "Failed to get EPG import jobs" });
    }
  });

  // User Analytics API
  
  // Get watch history for the current user
  app.get("/api/user/watch-history", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const watchHistory = await storage.getUserWatchHistory(userId);
      res.json(watchHistory);
    } catch (error) {
      console.error("Error getting watch history:", error);
      res.status(500).json({ message: "Failed to get watch history" });
    }
  });
  
  // Get watch history stats for the current user
  app.get("/api/user/watch-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const stats = await storage.getUserWatchStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting watch stats:", error);
      res.status(500).json({ message: "Failed to get watch statistics" });
    }
  });
  
  // Record watch event
  app.post("/api/user/watch", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const watchData = insertWatchHistorySchema.parse({
        ...req.body,
        userId,
      });
      
      const watchRecord = await storage.recordWatchEvent(watchData);
      res.status(201).json(watchRecord);
    } catch (error) {
      console.error("Error recording watch event:", error);
      res.status(500).json({ message: "Failed to record watch event" });
    }
  });
  
  // Update watch progress
  app.put("/api/user/watch/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid watch ID" });
      }
      
      const userId = req.user!.id;
      const watchData = await storage.getWatchHistory(id);
      
      if (!watchData) {
        return res.status(404).json({ message: "Watch record not found" });
      }
      
      if (watchData.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this record" });
      }
      
      const updatedWatch = await storage.updateWatchEvent(id, req.body);
      res.json(updatedWatch);
    } catch (error) {
      console.error("Error updating watch event:", error);
      res.status(500).json({ message: "Failed to update watch event" });
    }
  });
  
  // User Preferences API
  
  // Get user preferences
  app.get("/api/user/preferences", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPreferences = await storage.createUserPreferences({
          userId,
          favorites: { movies: [], series: [], channels: [] },
          preferredCategories: [],
          contentFilters: {},
          uiSettings: {}
        });
        return res.json(defaultPreferences);
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error getting user preferences:", error);
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });
  
  // Update user preferences
  app.put("/api/user/preferences", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create preferences if they don't exist
        preferences = await storage.createUserPreferences({
          userId,
          ...req.body
        });
      } else {
        // Update existing preferences
        preferences = await storage.updateUserPreferences(userId, req.body);
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });
  
  // Site Settings API
  
  // Get site settings
  app.get("/api/site-settings", async (_req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      
      if (!settings) {
        // Return default settings if they don't exist in storage
        const defaultSettings = {
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
        return res.json(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error getting site settings:", error);
      res.status(500).json({ message: "Failed to get site settings" });
    }
  });
  
  // Update site settings (admin only)
  app.put("/api/admin/site-settings", ensureAdmin, async (req, res) => {
    try {
      // Validate settings data
      const validation = insertSiteSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid settings data", 
          errors: validation.error.format() 
        });
      }
      
      // Update settings
      const updatedSettings = await storage.updateSiteSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Failed to update site settings" });
    }
  });

  // Register payment and PPV routes
  app.use('/api/crypto-payments', cryptoPaymentsRoutes);
  app.use('/api/ppv', ppvRoutes);
  app.use('/api', userPreferencesRoutes);
  app.use('/api', watchHistoryRoutes);
  app.use('/api/analytics', analyticsRoutes);
  
  // Register stream routes for secure content streaming
  app.use('/api', streamRoutes);


  // Register premium content routes
  
  // Premium movies
  app.get("/api/premium/movies", ensurePremium, async (_req, res) => {
    try {
      const movies = await storage.getPremiumMovies();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching premium movies:", error);
      res.status(500).json({ message: "Failed to get premium movies" });
    }
  });
  
  // Stream access endpoints - these need premium verification
  app.get("/api/stream/premium/movies/:id", ensurePremium, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movie = await storage.getMovie(id);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      // If movie is premium, we ensure it's protected (redundant with middleware but good practice)
      if (movie.isPremium) {
        // We already checked premium status in middleware, so we're good to go
        res.json({ streamSources: movie.streamSources });
      } else {
        // Non-premium content can be accessed without subscription
        res.json({ streamSources: movie.streamSources });
      }
    } catch (error) {
      console.error("Error getting premium movie stream:", error);
      res.status(500).json({ message: "Failed to get movie stream" });
    }
  });
  
  // Premium series
  app.get("/api/premium/series", ensurePremium, async (_req, res) => {
    try {
      const series = await storage.getPremiumSeries();
      res.json(series);
    } catch (error) {
      console.error("Error fetching premium series:", error);
      res.status(500).json({ message: "Failed to get premium series" });
    }
  });
  
  // Premium series episodes
  app.get("/api/stream/premium/episodes/:id", ensurePremium, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid episode ID" });
      }
      
      const episode = await storage.getEpisode(id);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      // Get the series to check if it's premium
      const series = await storage.getSeries(episode.seriesId);
      if (!series) {
        return res.status(404).json({ message: "Series not found" });
      }
      
      // If series is premium, we ensure it's protected
      if (series.isPremium) {
        // Premium status already checked in middleware
        res.json({ streamSources: episode.streamSources });
      } else {
        // Non-premium content can be accessed without subscription
        res.json({ streamSources: episode.streamSources });
      }
    } catch (error) {
      console.error("Error getting premium episode stream:", error);
      res.status(500).json({ message: "Failed to get episode stream" });
    }
  });
  
  // Premium channels
  app.get("/api/premium/channels", ensurePremium, async (_req, res) => {
    try {
      const channels = await storage.getPremiumChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching premium channels:", error);
      res.status(500).json({ message: "Failed to get premium channels" });
    }
  });
  
  // Premium channel streams
  app.get("/api/stream/premium/channels/:id", ensurePremium, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }
      
      const channel = await storage.getChannel(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      // If channel is premium, we ensure it's protected
      if (channel.isPremium) {
        // Premium status already checked in middleware
        res.json({ streamSources: channel.streamSources });
      } else {
        // Non-premium content can be accessed without subscription
        res.json({ streamSources: channel.streamSources });
      }
    } catch (error) {
      console.error("Error getting premium channel stream:", error);
      res.status(500).json({ message: "Failed to get channel stream" });
    }
  });

  // Check premium status endpoint
  app.get("/api/user/premium/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          message: "Unauthorized. Please log in.",
          isPremium: false
        });
      }
      
      const userId = req.user!.id;
      const premiumStatus = await storage.checkUserPremiumStatus(userId);
      
      return res.json({
        ...premiumStatus,
        expiryFormatted: premiumStatus.expiryDate 
          ? new Date(premiumStatus.expiryDate).toLocaleDateString() 
          : null
      });
    } catch (error) {
      console.error("Error checking premium status:", error);
      res.status(500).json({ message: "Error checking premium status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Zod validator middleware
export function zValidator(type: "body" | "params" | "query", schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: Function) => {
    try {
      const result = schema.parse(req[type]);
      req[type] = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
