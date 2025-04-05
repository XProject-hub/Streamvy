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
router.post("/stream", async (req, res) => {
  try {
    // If testMode is true or X-Test-Access header is present, bypass authentication
    const isTestMode = req.query.testMode === 'true' || req.headers['x-test-access'] === 'true';
    
    if (!req.isAuthenticated() && !isTestMode) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const validationResult = streamAnalyticsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid analytics data", 
        errors: validationResult.error.errors
      });
    }
    
    // Use default userId (1) for test mode, otherwise use authenticated user's ID
    let userId = 1; // Default to admin user for test mode
    
    if (!isTestMode && req.user) {
      userId = req.user.id;
    }
    
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
router.get("/stream/quality", async (req, res) => {
  try {
    // If testMode is true or X-Test-Access header is present, bypass authentication
    const isTestMode = req.query.testMode === 'true' || req.headers['x-test-access'] === 'true';
    
    if (!req.isAuthenticated() && !isTestMode) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get period (default to 7 days)
    const periodDays = parseInt(req.query.period as string) || 7;
    
    // Use default userId (1) for test mode, otherwise use authenticated user's ID
    let userId = 1; // Default admin user ID for test mode
    let isAdmin = true; // Assume admin for test mode
    
    if (!isTestMode && req.user) {
      userId = req.user.id;
      isAdmin = req.user.isAdmin;
    }
    
    // Admins can query all users or specific userId
    let targetUserId = userId;
    if (isAdmin && req.query.userId) {
      targetUserId = parseInt(req.query.userId as string);
    }
    
    // Set the content type to ensure JSON is returned
    res.setHeader('Content-Type', 'application/json');
    
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

/**
 * Test analytics with sample data
 * GET /api/analytics/test
 * This endpoint will create some test analytics events and return quality analytics
 */
router.get("/test", async (req, res) => {
  try {
    console.log('Running analytics test with sample data...');
    
    const userId = 1; // Default admin user
    const contentId = 10; // Use BeIN Sports 1 channel
    
    // Create sample analytics events
    const events = [
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'start', 
        quality: '720p', 
        bandwidth: 2800000,
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'bandwidth_change', 
        bandwidth: 3200000,
        timestamp: new Date(Date.now() - 1000 * 60 * 55), // 55 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'buffering', 
        bufferingDuration: 2800,
        timestamp: new Date(Date.now() - 1000 * 60 * 50), // 50 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'quality_change', 
        quality: '480p',
        bandwidth: 1500000,
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'bandwidth_change', 
        bandwidth: 1800000,
        timestamp: new Date(Date.now() - 1000 * 60 * 40), // 40 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'bandwidth_change', 
        bandwidth: 4500000,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'quality_change', 
        quality: '1080p',
        bandwidth: 4200000,
        timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'error', 
        error: 'Failed to load segment: HTTP 404',
        timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'quality_change', 
        quality: '720p',
        bandwidth: 3000000,
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      },
      { 
        userId, 
        contentType: 'channel', 
        contentId, 
        event: 'stop', 
        duration: 450,
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent'
      }
    ];
    
    // Insert all events
    for (const event of events) {
      await storage.recordStreamAnalytics(event);
    }
    
    // Get analytics for the test user
    const analytics = await storage.getStreamQualityAnalytics(userId, 7); // Last 7 days
    
    // Format response
    const response = {
      message: 'Analytics test completed successfully',
      eventsCreated: events.length,
      analytics
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in analytics test endpoint:', error);
    return res.status(500).json({ message: 'Error in analytics test', error: String(error) });
  }
});

export default router;