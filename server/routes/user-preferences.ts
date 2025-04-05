import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Ensure user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  next();
};

// Get user preferences
router.get("/preferences", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = await storage.getUserPreferences(userId);
    
    if (!preferences) {
      // If no preferences exist yet, return defaults
      return res.json({
        favorites: { movies: [], series: [], channels: [] },
        preferredCategories: [],
        contentFilters: {},
        uiSettings: {}
      });
    }
    
    return res.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return res.status(500).json({ message: "Failed to fetch user preferences" });
  }
});

// Update user preferences
router.put("/preferences", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { preferredCategories, contentFilters, uiSettings } = req.body;
    
    // Get current preferences or create new ones
    let preferences = await storage.getUserPreferences(userId);
    
    if (!preferences) {
      preferences = await storage.createUserPreferences({
        userId,
        favorites: { movies: [], series: [], channels: [] },
        preferredCategories: preferredCategories || [],
        contentFilters: contentFilters || {},
        uiSettings: uiSettings || {}
      });
    } else {
      preferences = await storage.updateUserPreferences(userId, {
        preferredCategories,
        contentFilters,
        uiSettings
      });
    }
    
    return res.json(preferences);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return res.status(500).json({ message: "Failed to update user preferences" });
  }
});

// Toggle favorite item
router.post("/favorites/toggle", ensureAuthenticated, async (req, res) => {
  try {
    const toggleFavoriteSchema = z.object({
      contentType: z.enum(["movies", "series", "channels"]),
      contentId: z.number()
    });
    
    // Validate request body
    const validationResult = toggleFavoriteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: validationResult.error.errors 
      });
    }
    
    const userId = req.user!.id;
    const { contentType, contentId } = validationResult.data;
    
    // Toggle the favorite status
    const updatedPreferences = await storage.toggleFavorite(userId, contentType, contentId);
    
    return res.json(updatedPreferences);
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return res.status(500).json({ message: "Failed to toggle favorite status" });
  }
});

// Get favorites by type
router.get("/favorites/:type", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const type = req.params.type as string;
    
    // Validate the type
    if (!["movies", "series", "channels"].includes(type)) {
      return res.status(400).json({ message: "Invalid content type" });
    }
    
    // Get user preferences
    const preferences = await storage.getUserPreferences(userId);
    
    if (!preferences) {
      return res.json([]);
    }
    
    // Get the favorite IDs for the specified type
    const favoriteIds = (preferences.favorites as any)[type] || [];
    
    // Fetch the actual content items
    let favoriteItems: any[] = [];
    
    if (type === "movies" && favoriteIds.length > 0) {
      // Fetch each movie individually since we need to fetch by ID
      favoriteItems = await Promise.all(
        favoriteIds.map(async (id: number) => {
          const movie = await storage.getMovie(id);
          return movie;
        })
      );
      // Filter out any null/undefined results (in case a favorite was deleted)
      favoriteItems = favoriteItems.filter(Boolean);
    } 
    else if (type === "series" && favoriteIds.length > 0) {
      favoriteItems = await Promise.all(
        favoriteIds.map(async (id: number) => {
          const series = await storage.getSeries(id);
          return series;
        })
      );
      favoriteItems = favoriteItems.filter(Boolean);
    } 
    else if (type === "channels" && favoriteIds.length > 0) {
      favoriteItems = await Promise.all(
        favoriteIds.map(async (id: number) => {
          const channel = await storage.getChannel(id);
          return channel;
        })
      );
      favoriteItems = favoriteItems.filter(Boolean);
    }
    
    return res.json(favoriteItems);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} favorites:`, error);
    return res.status(500).json({ message: `Failed to fetch ${req.params.type} favorites` });
  }
});

export default router;