import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Ensure user is authenticated
const ensureAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Middleware to check if user has PPV access to the content
const ensurePPVAccess = async (req: any, res: any, next: any) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.user.id;
    const { contentType, contentId } = req.params;
    
    // If premium user, allow access without PPV
    const premiumStatus = await storage.checkUserPremiumStatus(userId);
    if (premiumStatus.isPremium) {
      return next();
    }
    
    // Check if user has purchased PPV access
    const ppvPurchase = await storage.getUserPPVForContent(
      userId,
      contentType,
      parseInt(contentId)
    );
    
    if (!ppvPurchase) {
      return res.status(403).json({ 
        message: 'Pay-per-view purchase required for this content',
        requiresPPV: true
      });
    }
    
    // Add PPV information to the request for later use
    req.ppvPurchase = ppvPurchase;
    next();
  } catch (error) {
    console.error('Error checking PPV access:', error);
    res.status(500).json({ message: 'Error checking PPV access' });
  }
};

// Get user's PPV purchases
router.get('/purchases', ensureAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const purchases = await storage.getPPVPurchasesByUserId(userId);
    
    // Enrich PPV data with content details
    const enrichedPurchases = await Promise.all(purchases.map(async (purchase) => {
      let contentDetails: any = { title: 'Unknown Content' };
      
      try {
        if (purchase.contentType === 'movie') {
          const movie = await storage.getMovie(purchase.contentId);
          if (movie) {
            contentDetails = {
              title: movie.title,
              poster: movie.poster,
              year: movie.year
            };
          }
        } else if (purchase.contentType === 'series') {
          const series = await storage.getSeries(purchase.contentId);
          if (series) {
            contentDetails = {
              title: series.title,
              poster: series.poster,
              seasons: series.seasons
            };
          }
        } else if (purchase.contentType === 'channel') {
          const channel = await storage.getChannel(purchase.contentId);
          if (channel) {
            contentDetails = {
              title: channel.name,
              logo: channel.logo
            };
          }
        }
      } catch (error) {
        console.error('Error fetching content details for PPV purchase:', error);
      }
      
      return {
        ...purchase,
        content: contentDetails,
        isExpired: new Date() > purchase.expiresAt,
        formattedExpiryDate: purchase.expiresAt.toLocaleString()
      };
    }));
    
    res.json(enrichedPurchases);
  } catch (error) {
    console.error('Error fetching PPV purchases:', error);
    res.status(500).json({ message: 'Error fetching PPV purchases' });
  }
});

// Check if user has PPV access to specific content
router.get('/check/:contentType/:contentId', ensureAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, contentId } = req.params;
    
    // First check if user has premium access
    const premiumStatus = await storage.checkUserPremiumStatus(userId);
    if (premiumStatus.isPremium) {
      return res.json({
        hasAccess: true,
        accessType: 'premium',
        message: 'Access granted through premium subscription'
      });
    }
    
    // If not premium, check PPV purchase
    const ppvPurchase = await storage.getUserPPVForContent(
      userId,
      contentType,
      parseInt(contentId)
    );
    
    if (ppvPurchase) {
      // Calculate remaining time
      const now = new Date();
      const remainingMs = ppvPurchase.expiresAt.getTime() - now.getTime();
      const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
      const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
      
      return res.json({
        hasAccess: true,
        accessType: 'ppv',
        purchase: {
          id: ppvPurchase.id,
          purchasedAt: ppvPurchase.purchasedAt,
          expiresAt: ppvPurchase.expiresAt,
          paymentMethod: ppvPurchase.paymentMethod
        },
        remainingTime: {
          hours: remainingHours,
          minutes: remainingMinutes,
          totalMinutes: Math.max(0, Math.floor(remainingMs / (1000 * 60)))
        },
        message: `Access granted through PPV purchase (${remainingHours}h ${remainingMinutes}m remaining)`
      });
    }
    
    // If no premium or PPV access, get the content details to display purchase options
    let contentDetails = null;
    let ppvPrice = 0;
    
    if (contentType === 'movie') {
      const movie = await storage.getMovie(parseInt(contentId));
      if (movie) {
        contentDetails = {
          title: movie.title,
          poster: movie.poster,
          year: movie.year
        };
        ppvPrice = 4.99; // Example price
      }
    } else if (contentType === 'series') {
      const series = await storage.getSeries(parseInt(contentId));
      if (series) {
        contentDetails = {
          title: series.title,
          poster: series.poster,
          seasons: series.seasons
        };
        ppvPrice = 7.99; // Example price for whole series
      }
    } else if (contentType === 'channel') {
      const channel = await storage.getChannel(parseInt(contentId));
      if (channel) {
        contentDetails = {
          title: channel.name,
          logo: channel.logo
        };
        ppvPrice = 2.99; // Example price for 24h channel access
      }
    }
    
    res.json({
      hasAccess: false,
      contentDetails,
      purchaseOptions: {
        ppvPrice,
        premiumOptions: [
          { name: 'daily', price: 5, description: '24-hour access to all premium content' },
          { name: 'monthly', price: 10, description: '30-day access to all premium content' },
          { name: 'annual', price: 110, description: '12-month access at a discount' }
        ]
      },
      message: 'Purchase required for access'
    });
  } catch (error) {
    console.error('Error checking PPV access:', error);
    res.status(500).json({ message: 'Error checking PPV access' });
  }
});

// Create a new PPV purchase (for crypto payments, Stripe is handled separately)
router.post('/purchase', ensureAuth, async (req, res) => {
  try {
    const createPurchaseSchema = z.object({
      contentType: z.string(),
      contentId: z.number(),
      paymentMethod: z.string(),
      paymentId: z.string(),
      amount: z.number(),
      expiryHours: z.number().default(48)
    });
    
    const result = createPurchaseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid request data', errors: result.error.errors });
    }
    
    const { contentType, contentId, paymentMethod, paymentId, amount, expiryHours } = result.data;
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);
    
    // Create the PPV purchase
    const ppvPurchase = await storage.createPPVPurchase({
      userId: req.user.id,
      contentType,
      contentId,
      amount,
      paymentMethod,
      paymentId,
      status: 'completed',
      isActive: true,
      expiresAt
    });
    
    res.status(201).json({
      message: 'PPV purchase successful',
      purchase: {
        id: ppvPurchase.id,
        expiresAt: ppvPurchase.expiresAt,
        formattedExpiryDate: ppvPurchase.expiresAt.toLocaleString()
      }
    });
  } catch (error) {
    console.error('Error creating PPV purchase:', error);
    res.status(500).json({ message: 'Error creating PPV purchase' });
  }
});

// Get content with PPV protection
router.get('/content/:contentType/:contentId', ensurePPVAccess, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    
    // Access is already verified by the middleware
    let content;
    
    if (contentType === 'movie') {
      content = await storage.getMovie(parseInt(contentId));
    } else if (contentType === 'series') {
      content = await storage.getSeries(parseInt(contentId));
    } else if (contentType === 'channel') {
      content = await storage.getChannel(parseInt(contentId));
    } else {
      return res.status(400).json({ message: 'Invalid content type' });
    }
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Add PPV access info if present
    if (req.ppvPurchase) {
      const now = new Date();
      const remainingMs = req.ppvPurchase.expiresAt.getTime() - now.getTime();
      const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
      const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
      
      content.ppvAccess = {
        purchaseId: req.ppvPurchase.id,
        expiresAt: req.ppvPurchase.expiresAt,
        remainingTime: `${remainingHours}h ${remainingMinutes}m`
      };
    }
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching PPV content:', error);
    res.status(500).json({ message: 'Error fetching PPV content' });
  }
});

// Get list of popular PPV content
router.get('/popular', async (req, res) => {
  try {
    // Get the most purchased PPV content in the last month
    const popularPPV = await storage.getPopularPPVContent();
    
    res.json(popularPPV);
  } catch (error) {
    console.error('Error fetching popular PPV content:', error);
    res.status(500).json({ message: 'Error fetching popular PPV content' });
  }
});

export default router;