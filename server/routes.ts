import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { setupAuth } from "./auth";
import { storage, MemStorage } from "./storage";
import axios from "axios";
import {
  insertCategorySchema,
  insertCountrySchema,
  insertChannelSchema,
  insertProgramSchema,
  insertMovieSchema,
  insertSeriesSchema,
  insertEpisodeSchema,
} from "@shared/schema";

// Admin middleware to check if user is an admin
const ensureAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Unauthorized. Admin access required." });
  }
  next();
};

// Define the EPG source schema to validate requests
const epgSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Valid URL is required"),
  description: z.string().optional(),
});

// Function to discover EPG sources based on country code
async function discoverEPGSources(countryCode: string): Promise<Array<{name: string, url: string, description: string}>> {
  // Common EPG source patterns by country
  const commonPatterns = {
    // European sources
    'uk': [
      { name: 'UK - XMLTV.co.uk', url: 'https://xmltv.co.uk/feed/tv.xml', description: 'Free UK TV listings' },
      { name: 'UK - EPG Heaven', url: 'http://epg.streamstv.me/epg/guide-uk.xml.gz', description: 'UK TV guide' }
    ],
    'de': [
      { name: 'Germany - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-germany.xml.gz', description: 'German TV programs' }
    ],
    'fr': [
      { name: 'France - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-france.xml.gz', description: 'French TV listings' }
    ],
    'it': [
      { name: 'Italy - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-italy.xml.gz', description: 'Italian TV guide' }
    ],
    'es': [
      { name: 'Spain - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-spain.xml.gz', description: 'Spanish TV listings' }
    ],
    
    // North America
    'us': [
      { name: 'USA - XMLTV.net', url: 'http://xmltv.net/xml_files/TV_Listings.xml', description: 'US TV listings' },
      { name: 'USA - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-usa.xml.gz', description: 'American TV guide' }
    ],
    'ca': [
      { name: 'Canada - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-canada.xml.gz', description: 'Canadian TV listings' }
    ],
    
    // Asia-Pacific
    'au': [
      { name: 'Australia - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-australia.xml.gz', description: 'Australian TV guide' }
    ],
    'jp': [
      { name: 'Japan - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-japan.xml.gz', description: 'Japanese TV listings' }
    ],
    
    // Middle East
    'ae': [
      { name: 'UAE - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-uae.xml.gz', description: 'UAE TV listings' }
    ],
    
    // Custom for Turkey
    'tr': [
      { name: 'Turkey - IPTV-EPG', url: 'https://epg.streamstv.me/epg/guide-turkey.xml.gz', description: 'Turkish TV guide' },
      { name: 'Turkey - TurkEPG', url: 'https://iptv-org.github.io/epg/guides/tr/tvplus.com.tr.epg.xml', description: 'Turkish TV listings' }
    ],
    
    // General sources for all countries
    'all': [
      { name: 'International - IPTV-ORG', url: 'https://iptv-org.github.io/epg/guides/index.xml', description: 'Guide to all available EPG sources' },
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
        name: `${countryCode.toUpperCase()} - Auto-Generated`, 
        url: `https://epg.streamstv.me/epg/guide-${countryCode}.xml.gz`, 
        description: `Auto-generated URL for ${countryCode.toUpperCase()} EPG sources` 
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
      res.status(500).json({ message: "Failed to get series by category" });
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
      const channel = await storage.createChannel(req.body);
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
      
      // Refresh EPG source
      const refreshedSource = await storage.refreshEPGSource(id);
      if (!refreshedSource) {
        return res.status(500).json({ message: "Failed to refresh EPG data" });
      }
      
      res.json({
        message: "EPG data refreshed successfully",
        source: refreshedSource
      });
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
