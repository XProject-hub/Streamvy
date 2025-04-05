import { Request, Response } from "express";
import { storage } from "../storage";

/**
 * Middleware to check if user has active premium subscription
 */
export const ensurePremium = async (req: Request, res: Response, next: Function) => {
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