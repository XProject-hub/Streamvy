import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertStreamAnalyticsSchema } from "@shared/schema";

// Create router
const router = Router();

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Stream analytics data schema
const streamAnalyticsSchema = z.object({
  contentType: z.enum(["movie", "episode", "channel", "unknown"]),
  contentId: z.number().int().nonnegative(),
  event: z.enum([
    "start", "stop", "error", "buffering", "quality_change", "bandwidth_change"
  ]),
  quality: z.string().optional(),
  bandwidth: z.number().int().nonnegative().optional(),
  location: z.string().optional(),
  duration: z.number().int().optional(),
  error: z.string().optional(),
  bufferingDuration: z.number().int().optional(),
  customData: z.record(z.unknown()).optional(),
});

/**
 * Record stream analytics event
 * POST /api/analytics/stream
 */
router.post("/stream", ensureAuthenticated, async (req, res) => {
  try {
    const validationResult = streamAnalyticsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid analytics data", 
        errors: validationResult.error.errors
      });
    }
    
    const userId = req.user!.id;
    const data = validationResult.data;
    
    // Add user info from request
    const analyticsData = {
      ...data,
      userId,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
    };
    
    // Record the analytics event
    const record = await storage.recordStreamAnalytics(analyticsData);
    
    return res.status(201).json({ success: true, id: record.id });
  } catch (error) {
    console.error("Error recording stream analytics:", error);
    return res.status(500).json({ message: "Failed to record analytics data" });
  }
});

/**
 * Get streaming quality analytics data
 * GET /api/analytics/stream/quality
 */
router.get("/stream/quality", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.isAdmin;
    
    // Get period (default to 7 days)
    const periodDays = parseInt(req.query.period as string) || 7;
    
    // Admins can query all users or specific userId
    let targetUserId = userId;
    if (isAdmin && req.query.userId) {
      targetUserId = parseInt(req.query.userId as string);
    }
    
    // Get analytics for the user/period
    const qualityAnalytics = await storage.getStreamQualityAnalytics(targetUserId, periodDays);
    
    return res.status(200).json(qualityAnalytics);
  } catch (error) {
    console.error("Error retrieving quality analytics:", error);
    return res.status(500).json({ message: "Failed to retrieve quality analytics" });
  }
});

/**
 * Create a basic ping endpoint for network measurements
 * HEAD /api/analytics/network-test
 * Used by the client to measure network conditions
 */
router.head("/network-test", (req, res) => {
  // Basic network test endpoint - just returns headers for measuring RTT
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.status(200).end();
});

export default router;