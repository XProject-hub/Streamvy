import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertWatchHistorySchema } from "@shared/schema";

const router = Router();

// Ensure user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  next();
};

// Get user watch history
router.get("/history", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const history = await storage.getUserWatchHistory(userId);
    
    // Enhance history items with content details
    const enhancedHistory = await Promise.all(
      history.map(async (item) => {
        let contentDetails = null;
        
        if (item.contentType === "movie") {
          contentDetails = await storage.getMovie(item.contentId);
        } else if (item.contentType === "channel") {
          contentDetails = await storage.getChannel(item.contentId);
        } else if (item.contentType === "episode") {
          contentDetails = await storage.getEpisode(item.contentId);
          // If this is an episode, get the series information too
          if (contentDetails) {
            const series = await storage.getSeries(contentDetails.seriesId);
            if (series) {
              contentDetails = {
                ...contentDetails,
                seriesTitle: series.title,
                seriesPoster: series.poster
              };
            }
          }
        }
        
        return {
          ...item,
          content: contentDetails
        };
      })
    );
    
    return res.json(enhancedHistory);
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return res.status(500).json({ message: "Failed to fetch watch history" });
  }
});

// Record watch event
router.post("/history", ensureAuthenticated, async (req, res) => {
  try {
    // Create a schema that extends the insert schema with validation
    const watchEventSchema = insertWatchHistorySchema.extend({
      contentType: z.enum(["movie", "episode", "channel"]),
      contentId: z.number().positive(),
      progress: z.number().min(0).max(100).optional(),
      duration: z.number().min(0).optional()
    });
    
    // Validate request body
    const validationResult = watchEventSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid watch history data", 
        errors: validationResult.error.errors 
      });
    }
    
    const userId = req.user!.id;
    const watchData = {
      ...validationResult.data,
      userId,
      startTime: new Date(),
    };
    
    const watchRecord = await storage.recordWatchEvent(watchData);
    
    return res.status(201).json(watchRecord);
  } catch (error) {
    console.error("Error recording watch event:", error);
    return res.status(500).json({ message: "Failed to record watch event" });
  }
});

// Update watch event
router.put("/history/:id", ensureAuthenticated, async (req, res) => {
  try {
    const watchId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Verify the watch record exists and belongs to the user
    const currentRecord = await storage.getWatchHistory(watchId);
    if (!currentRecord || currentRecord.userId !== userId) {
      return res.status(404).json({ message: "Watch record not found" });
    }
    
    // Validate update data
    const updateSchema = z.object({
      endTime: z.date().optional(),
      progress: z.number().min(0).max(100).optional(),
      duration: z.number().min(0).optional(),
      completed: z.boolean().optional()
    });
    
    const validationResult = updateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid update data", 
        errors: validationResult.error.errors 
      });
    }
    
    // If endTime is provided but no duration, calculate duration
    if (validationResult.data.endTime && !validationResult.data.duration) {
      const endTime = new Date(validationResult.data.endTime);
      const startTime = currentRecord.startTime;
      const durationMs = endTime.getTime() - startTime.getTime();
      validationResult.data.duration = Math.floor(durationMs / 1000); // Convert to seconds
    }
    
    // Update the watch record
    const updatedRecord = await storage.updateWatchEvent(
      watchId, 
      validationResult.data
    );
    
    return res.json(updatedRecord);
  } catch (error) {
    console.error("Error updating watch event:", error);
    return res.status(500).json({ message: "Failed to update watch event" });
  }
});

// Get watch statistics
router.get("/history/stats", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const stats = await storage.getUserWatchStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error("Error fetching watch statistics:", error);
    return res.status(500).json({ message: "Failed to fetch watch statistics" });
  }
});

export default router;