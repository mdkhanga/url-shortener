import { Router } from 'express';
import { UrlController } from '../controllers/urlController';

export const urlRoutes = Router();

// API Routes
urlRoutes.post('/api/shorten', UrlController.createShortUrl);
urlRoutes.get('/api/urls', UrlController.getAllUrls);
urlRoutes.get('/api/stats/:shortCode', UrlController.getUrlStats);
urlRoutes.delete('/api/urls/:shortCode', UrlController.deleteUrl);

// Redirect route (must be last to avoid conflicts)
urlRoutes.get('/:shortCode', UrlController.redirectToOriginalUrl);

// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`Error ${statusCode}: ${message}`);
  console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};

// src/middleware/rateLimiter.ts
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
