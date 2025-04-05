import crypto from 'crypto';

// Secret key for token signing (should be stored in environment variable in production)
const TOKEN_SECRET = process.env.STREAM_TOKEN_SECRET || 'your-stream-token-secret-key';
const TOKEN_EXPIRY = process.env.STREAM_TOKEN_EXPIRY_MINUTES ? 
  parseInt(process.env.STREAM_TOKEN_EXPIRY_MINUTES, 10) * 60 * 1000 : 
  15 * 60 * 1000; // Default 15 minutes in milliseconds

interface StreamTokenPayload {
  contentType: string;  // 'movie', 'episode', 'channel'
  contentId: number;
  userId: number;
  expiry: number;       // Timestamp when token expires
}

/**
 * Generates a signed token for secure stream access
 * 
 * @param contentType Type of content ('movie', 'episode', 'channel')
 * @param contentId ID of the content
 * @param userId ID of the user requesting the stream
 * @returns Signed token string
 */
export function generateStreamToken(contentType: string, contentId: number, userId: number): string {
  // Create token payload
  const payload: StreamTokenPayload = {
    contentType,
    contentId,
    userId,
    expiry: Date.now() + TOKEN_EXPIRY, // Token expires in 15 minutes
  };
  
  // Stringify payload
  const payloadStr = JSON.stringify(payload);
  
  // Generate signature
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadStr)
    .digest('hex');
  
  // Return base64 encoded payload + signature
  return Buffer.from(`${payloadStr}|${signature}`).toString('base64');
}

/**
 * Validates a stream token
 * 
 * @param token The token to validate
 * @returns The decoded payload if valid, null if invalid
 */
export function validateStreamToken(token: string): StreamTokenPayload | null {
  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString();
    
    // Split payload and signature
    const [payloadStr, signature] = decoded.split('|');
    
    // Validate signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payloadStr)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('Stream token signature invalid');
      return null;
    }
    
    // Parse payload
    const payload: StreamTokenPayload = JSON.parse(payloadStr);
    
    // Check if token has expired
    if (payload.expiry < Date.now()) {
      console.warn('Stream token expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error validating stream token:', error);
    return null;
  }
}