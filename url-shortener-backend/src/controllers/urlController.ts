import { Request, Response } from 'express';
import { Database } from '../database/database';
import { UrlValidator } from '../utils/urlValidator';
import { ShortCodeGenerator } from '../utils/shortCodeGenerator';
import { CreateUrlRequest, CreateUrlResponse, ApiResponse, Url } from '../types';

export class UrlController {

  static db = new Database()  ;

  static async createShortUrl(req: Request, res: Response): Promise<void> {
    try {
      const { url, customCode }: CreateUrlRequest = req.body;

      // Validate URL
      if (!url) {
        res.status(400).json({
          success: false,
          error: 'URL is required'
        } as CreateUrlResponse);
        return;
      }

      if (!UrlValidator.isValidUrl(url)) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL'
        } as CreateUrlResponse);
        return;
      }

      // Normalize URL
      const normalizedUrl = UrlValidator.normalizeUrl(url);

      // Generate or validate short code
      let shortCode: string;
      
      if (customCode) {
        if (!ShortCodeGenerator.isValidCustomCode(customCode)) {
          res.status(400).json({
            success: false,
            error: 'Invalid custom code. Must be 3-20 alphanumeric characters and not a reserved word'
          } as CreateUrlResponse);
          return;
        }
        
        // Check if custom code already exists
        const existingUrl = await UrlController.db.getUrlByShortCode(customCode);
        if (existingUrl) {
          res.status(409).json({
            success: false,
            error: 'Custom code already exists. Please choose a different one'
          } as CreateUrlResponse);
          return;
        }
        
        shortCode = customCode;
      } else {
        // Generate unique short code
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          shortCode = ShortCodeGenerator.generate();
          const existing = await UrlController.db.getUrlByShortCode(shortCode);
          if (!existing) break;
          
          attempts++;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
          res.status(500).json({
            success: false,
            error: 'Unable to generate unique short code. Please try again'
          } as CreateUrlResponse);
          return;
        }
      }

      // Create URL record
      const urlRecord = await UrlController.db.createUrl({
        originalUrl: normalizedUrl,
        shortCode,
        clickCount: 0
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const shortUrl = `${baseUrl}/${shortCode}`;

      res.status(201).json({
        success: true,
        data: {
          id: urlRecord.id!,
          originalUrl: urlRecord.originalUrl,
          shortCode: urlRecord.shortCode,
          shortUrl,
          createdAt: urlRecord.createdAt
        }
      } as CreateUrlResponse);

    } catch (error) {
      console.error('Error creating short URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as CreateUrlResponse);
    }
  }

  static async redirectToOriginalUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;

      if (!shortCode) {
        res.status(400).json({
          success: false,
          error: 'Short code is required'
        } as ApiResponse<null>);
        return;
      }

      const urlRecord = await UrlController.db.getUrlByShortCode(shortCode);

      if (!urlRecord) {
        res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
              <title>404 - URL Not Found</title>
              <style>
                  body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
                  .error-container { max-width: 500px; margin: 0 auto; }
                  h1 { color: #e74c3c; }
                  p { color: #7f8c8d; margin: 20px 0; }
                  .back-link { color: #3498db; text-decoration: none; }
                  .back-link:hover { text-decoration: underline; }
              </style>
          </head>
          <body>
              <div class="error-container">
                  <h1>404 - URL Not Found</h1>
                  <p>The short URL you're looking for doesn't exist or has been removed.</p>
                  <p><a href="/" class="back-link">← Go back to home</a></p>
              </div>
          </body>
          </html>
        `);
        return;
      }

      // Increment click count
      await UrlController.db.incrementClickCount(shortCode);

      // Redirect to original URL
      res.redirect(301, urlRecord.originalUrl);

    } catch (error) {
      console.error('Error redirecting URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async getAllUrls(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const { urls, total } = await UrlController.db.getAllUrls(limit, offset);
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const urlsWithShortUrl = urls.map(url => ({
        ...url,
        shortUrl: `${baseUrl}/${url.shortCode}`
      }));

      res.json({
        success: true,
        data: urlsWithShortUrl,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        message: `Found ${total} URLs (showing page ${page})`
      } as ApiResponse<typeof urlsWithShortUrl>);

    } catch (error) {
      console.error('Error fetching URLs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async deleteUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;

      if (!shortCode) {
        res.status(400).json({
          success: false,
          error: 'Short code is required'
        } as ApiResponse<null>);
        return;
      }

      const deleted = await UrlController.db.deleteUrl(shortCode);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'URL not found'
        } as ApiResponse<null>);
        return;
      }

      res.json({
        success: true,
        message: 'URL deleted successfully'
      } as ApiResponse<null>);

    } catch (error) {
      console.error('Error deleting URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }

  static async getUrlStats(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;

      if (!shortCode) {
        res.status(400).json({
          success: false,
          error: 'Short code is required'
        } as ApiResponse<null>);
        return;
      }

      const urlRecord = await UrlController.db.getUrlByShortCode(shortCode);

      if (!urlRecord) {
        res.status(404).json({
          success: false,
          error: 'URL not found'
        } as ApiResponse<null>);
        return;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      res.json({
        success: true,
        data: {
          ...urlRecord,
          shortUrl: `${baseUrl}/${urlRecord.shortCode}`
        }
      } as ApiResponse<typeof urlRecord & { shortUrl: string }>);

    } catch (error) {
      console.error('Error fetching URL stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      } as ApiResponse<null>);
    }
  }
}