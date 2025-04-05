import express from 'express';
import { generateStreamToken } from '../utils/stream-token';
import { proxyStream } from '../utils/stream-proxy';
import { storage } from '../storage';

const router = express.Router();

/**
 * Get a secure streaming token for a movie
 * This endpoint returns a token instead of the actual stream URL
 */
router.get('/token/movies/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const movieId = parseInt(req.params.id);
    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }
    
    // Check if movie exists
    const movie = await storage.getMovie(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    // Check premium status if movie is premium
    if (movie.isPremium) {
      // Use storage to check premium status instead of user object
      const premiumStatus = await storage.checkUserPremiumStatus(req.user.id);
      if (!premiumStatus.isPremium) {
        return res.status(403).json({ error: 'This content requires premium subscription' });
      }
    }
    
    // Generate secure token
    const token = generateStreamToken('movie', movieId, req.user.id);
    
    // Return token to client
    res.json({ token });
  } catch (error) {
    console.error('Error generating movie stream token:', error);
    res.status(500).json({ error: 'Failed to generate stream token' });
  }
});

/**
 * Get a secure streaming token for an episode
 */
router.get('/token/episodes/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const episodeId = parseInt(req.params.id);
    if (isNaN(episodeId)) {
      return res.status(400).json({ error: 'Invalid episode ID' });
    }
    
    // Check if episode exists
    const episode = await storage.getEpisode(episodeId);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    // Check if the series is premium
    const series = await storage.getSeries(episode.seriesId);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    
    // Check premium status if series is premium
    if (series.isPremium) {
      // Use storage to check premium status instead of user object
      const premiumStatus = await storage.checkUserPremiumStatus(req.user.id);
      if (!premiumStatus.isPremium) {
        return res.status(403).json({ error: 'This content requires premium subscription' });
      }
    }
    
    // Generate secure token
    const token = generateStreamToken('episode', episodeId, req.user.id);
    
    // Return token to client
    res.json({ token });
  } catch (error) {
    console.error('Error generating episode stream token:', error);
    res.status(500).json({ error: 'Failed to generate stream token' });
  }
});

/**
 * Get a secure streaming token for a channel
 */
router.get('/token/channels/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const channelId = parseInt(req.params.id);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }
    
    // Check if channel exists
    const channel = await storage.getChannel(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Check premium status if channel is premium
    if (channel.isPremium) {
      // Use storage to check premium status instead of user object
      const premiumStatus = await storage.checkUserPremiumStatus(req.user.id);
      if (!premiumStatus.isPremium) {
        return res.status(403).json({ error: 'This channel requires premium subscription' });
      }
    }
    
    // Generate secure token
    const token = generateStreamToken('channel', channelId, req.user.id);
    
    // Return token to client
    res.json({ token });
  } catch (error) {
    console.error('Error generating channel stream token:', error);
    res.status(500).json({ error: 'Failed to generate stream token' });
  }
});

/**
 * Stream proxy endpoint - proxies the actual content through our server
 * All stream URLs will be rewritten to use this endpoint
 */
router.get('/stream/:token/*', proxyStream);

export default router;