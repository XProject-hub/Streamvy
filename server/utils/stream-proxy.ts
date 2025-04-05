import axios from 'axios';
import { Request, Response } from 'express';
import { validateStreamToken } from './stream-token';
import { storage } from '../storage';

// Cache for holding stream source information to minimize DB queries
type StreamCache = {
  url: string;
  timestamp: number;
  format: string;
};

const streamCache: Record<string, StreamCache> = {};
const CACHE_TTL = 300000; // 5 minutes in milliseconds

/**
 * Proxy handler for secure stream requests
 * 
 * @param req Express request
 * @param res Express response
 */
export async function proxyStream(req: Request, res: Response): Promise<void> {
  try {
    // Extract token from query parameters
    const { token } = req.params;
    
    if (!token) {
      return send403(res, 'Missing stream token');
    }
    
    // Validate token
    const payload = validateStreamToken(token);
    if (!payload) {
      return send403(res, 'Invalid or expired stream token');
    }
    
    // Get actual stream URL based on content type and ID
    let streamUrl: string | null = null;
    let contentFormat: string = 'hls'; // Default format
    
    // Check cache first to avoid DB queries for every chunk
    const cacheKey = `${payload.contentType}:${payload.contentId}`;
    const cachedStream = streamCache[cacheKey];
    
    if (cachedStream && (Date.now() - cachedStream.timestamp) < CACHE_TTL) {
      streamUrl = cachedStream.url;
      contentFormat = cachedStream.format;
    } else {
      // Get stream source from database
      switch (payload.contentType) {
        case 'movie': {
          const movie = await storage.getMovie(payload.contentId);
          if (!movie || !movie.streamSources || !Array.isArray(movie.streamSources) || movie.streamSources.length === 0) {
            return send404(res, 'Stream source not found');
          }
          
          // Sort stream sources by priority (lower is better)
          const sources = [...movie.streamSources].sort((a, b) => a.priority - b.priority);
          streamUrl = sources[0].url;
          contentFormat = sources[0].format || 'hls';
          break;
        }
        
        case 'episode': {
          const episode = await storage.getEpisode(payload.contentId);
          if (!episode || !episode.streamSources || !Array.isArray(episode.streamSources) || episode.streamSources.length === 0) {
            return send404(res, 'Stream source not found');
          }
          
          // Sort stream sources by priority (lower is better)
          const sources = [...episode.streamSources].sort((a, b) => a.priority - b.priority);
          streamUrl = sources[0].url;
          contentFormat = sources[0].format || 'hls';
          break;
        }
        
        case 'channel': {
          const channel = await storage.getChannel(payload.contentId);
          if (!channel || !channel.streamSources || !Array.isArray(channel.streamSources) || channel.streamSources.length === 0) {
            return send404(res, 'Stream source not found');
          }
          
          // Sort stream sources by priority (lower is better)
          const sources = [...channel.streamSources].sort((a, b) => a.priority - b.priority);
          streamUrl = sources[0].url;
          contentFormat = sources[0].format || 'hls';
          break;
        }
        
        default:
          return send400(res, 'Invalid content type');
      }
      
      // Cache the result
      if (streamUrl) {
        streamCache[cacheKey] = {
          url: streamUrl,
          timestamp: Date.now(),
          format: contentFormat
        };
      }
    }
    
    if (!streamUrl) {
      return send404(res, 'Stream source not found');
    }
    
    // Record watch event (for analytics)
    try {
      await storage.recordWatchEvent({
        userId: payload.userId,
        contentType: payload.contentType,
        contentId: payload.contentId,
        startTime: new Date(),
        duration: 0,
        progress: 0,
        completed: false
      });
    } catch (error) {
      console.error('Error recording watch event:', error);
      // Continue with stream proxy even if recording fails
    }
    
    // Handle different stream formats
    if (contentFormat === 'hls' && req.path.endsWith('.m3u8')) {
      // For HLS manifests, we need to proxy the manifest and rewrite URLs within it
      return proxyHlsManifest(streamUrl, req, res);
    } else if (contentFormat === 'hls' && req.path.endsWith('.ts')) {
      // For HLS segments (.ts files), just proxy the content directly
      return proxyContent(streamUrl, req, res); 
    } else {
      // For other formats, proxy the content directly
      return proxyContent(streamUrl, req, res);
    }
  } catch (error) {
    console.error('Error in stream proxy:', error);
    return send500(res, 'Internal server error');
  }
}

/**
 * Proxies HLS manifest and rewrites URLs to use our secure proxy
 */
async function proxyHlsManifest(baseUrl: string, req: Request, res: Response): Promise<void> {
  try {
    const response = await axios.get(baseUrl, {
      responseType: 'text',
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
      }
    });
    
    if (response.status !== 200) {
      return send404(res, 'Stream manifest not found');
    }
    
    // Set content type header
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    
    // Get the token from the original request
    const token = req.params.token;
    
    // Rewrite URLs in the manifest to use our proxy
    let manifest = response.data;
    
    // Replace relative URLs
    // For .ts segment files
    manifest = manifest.replace(/^([^#].+\.ts.*)$/gm, `/api/stream/${token}/$1`);
    
    // For sub-manifests (quality levels)
    manifest = manifest.replace(/^([^#].+\.m3u8.*)$/gm, `/api/stream/${token}/$1`);
    
    // Replace absolute URLs if present
    const urlRegex = /(https?:\/\/[^"'\s]+\.ts[^"'\s]*|https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g;
    manifest = manifest.replace(urlRegex, (match: string) => {
      // Extract the path from the URL
      const url = new URL(match);
      const path = url.pathname.substring(1); // Remove leading slash
      return `/api/stream/${token}/${path}`;
    });
    
    // Send the modified manifest
    res.send(manifest);
  } catch (error) {
    console.error('Error proxying HLS manifest:', error);
    return send500(res, 'Error proxying stream manifest');
  }
}

/**
 * Proxies stream content (like .ts segments or direct video)
 */
async function proxyContent(baseUrl: string, req: Request, res: Response): Promise<void> {
  try {
    // Get path segments (removing the first element which is the token)
    const pathSegments = req.path.split('/').slice(1);
    
    // Build the actual URL by combining the base URL with the requested path
    const actualUrl = pathSegments.length > 0 
      ? new URL(pathSegments.join('/'), baseUrl).toString()
      : baseUrl;
    
    const response = await axios.get(actualUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
      }
    });
    
    // Forward content-type header
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    
    // Pipe the stream response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying stream content:', error);
    return send500(res, 'Error proxying stream content');
  }
}

// Helper functions for error responses
function send400(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

function send403(res: Response, message: string): void {
  res.status(403).json({ error: message });
}

function send404(res: Response, message: string): void {
  res.status(404).json({ error: message });
}

function send500(res: Response, message: string): void {
  res.status(500).json({ error: message });
}