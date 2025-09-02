import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import { urlRoutes } from './routes/urlRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { SimpleRateLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 3000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}


app.use(cors());

// Rate limiting
const rateLimiter = new SimpleRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
app.use('/api', rateLimiter.middleware());

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'URL Shortener API',
    version: '1.0.0',
    endpoints: {
      'POST /api/shorten': 'Create a short URL',
      'GET /api/urls': 'Get all URLs',
      'GET /api/stats/:shortCode': 'Get URL statistics',
      'DELETE /api/urls/:shortCode': 'Delete a URL',
      'GET /:shortCode': 'Redirect to original URL'
    }
  });
});

// Routes
app.use('/', urlRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 URL Shortener API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api`);
});

export default app;
