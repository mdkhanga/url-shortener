import { Request, Response , NextFunction} from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class SimpleRateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();

      if (!this.store[clientId]) {
        this.store[clientId] = {
          count: 1,
          resetTime: now + this.windowMs
        };
        return next();
      }

      const clientData = this.store[clientId];

      if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + this.windowMs;
        return next();
      }

      if (clientData.count >= this.maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }

      clientData.count++;
      next();
    };
  }
}