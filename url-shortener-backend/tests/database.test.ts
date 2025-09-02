import { Database } from '../src/database/database';

import { Pool } from 'pg';

jest.setTimeout(30000);

// Test database configuration
const TEST_DB_CONFIG = {
  user: 'postgres',
  host: 'localhost',
  password: 'postgres',
  port: 5432,
  database: 'postgres' // We'll connect to default DB first to create test DB
};

const TEST_DB_NAME = 'url_shortener_test';

describe('Database Integration Tests', () => {
  let database: Database;
  let testDbName: string;

  beforeAll(async () => {
    // Check if PostgreSQL is available
    const checkPool = new Pool(TEST_DB_CONFIG);
    try {
      await checkPool.query('SELECT 1');
      console.log('PostgreSQL is available');
    } catch (error) {
      console.error('PostgreSQL not available, skipping tests');
      process.exit(0);
    } finally {
      await checkPool.end();
    }
  });

  beforeEach(async () => {
    // Create unique database for each test
    testDbName = `test_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const adminPool = new Pool(TEST_DB_CONFIG);
    try {
      await adminPool.query(`CREATE DATABASE ${testDbName}`);
    } finally {
      await adminPool.end();
    }

    // Set environment variables for the test database
    process.env.DB_NAME = testDbName;
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'postgres';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';

    // Create database instance
    database = new Database();
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterEach(async () => {
    // Close the database connection first
    if (database) {
      try {
        await database.close();

      } catch (error) {
        console.error('Error closing database:', error);
      }
    }

    // Then drop the test database
    const adminPool = new Pool(TEST_DB_CONFIG);
    try {
      // Terminate any active connections to the test database
      try {
        await adminPool.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid()
        `, [testDbName]);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (terminateError) {
        // Ignore termination errors
      }

      await adminPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    } finally {
      await adminPool.end();
    }
  });

  afterAll(async () => {
    // Ensure any remaining database instances are closed
    if (database) {
      await database.close();
    }
  });

  describe('Database Operations', () => {
    it('should initialize database with correct tables', async () => {
      // The database should be initialized in the constructor
      // We can verify by checking if we can perform operations
      const health = await database.healthCheck();
      expect(health).toBe(true);
    });

    it('should create and retrieve a URL', async () => {
      const urlData = {
        originalUrl: 'https://example.com/test',
        shortCode: 'test123',
        clickCount: 0
      };

      // Create URL
      const createdUrl = await database.createUrl(urlData);
      
      expect(createdUrl).toEqual({
        id: expect.any(Number),
        originalUrl: urlData.originalUrl,
        shortCode: urlData.shortCode,
        createdAt: expect.any(Date),
        clickCount: urlData.clickCount
      });

      // Retrieve by short code
      const retrievedUrl = await database.getUrlByShortCode(urlData.shortCode);
      expect(retrievedUrl).toEqual(createdUrl);

      // Retrieve by ID
      const retrievedById = await database.getUrlById(createdUrl.id as number);
      expect(retrievedById).toEqual(createdUrl);
    });

    it('should return null for non-existent URLs', async () => {
      const result = await database.getUrlByShortCode('nonexistent');
      expect(result).toBeNull();

      const resultById = await database.getUrlById(9999);
      expect(resultById).toBeNull();
    });

    it('should get all URLs with pagination', async () => {
      // Create multiple URLs
      const url1 = await database.createUrl({
        originalUrl: 'https://example.com/1',
        shortCode: 'test1',
        clickCount: 0
      });

      const url2 = await database.createUrl({
        originalUrl: 'https://example.com/2',
        shortCode: 'test2',
        clickCount: 0
      });

      const result = await database.getAllUrls(10, 0);
      
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.urls.length).toBeGreaterThanOrEqual(2);
      expect(result.urls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ shortCode: 'test1' }),
          expect.objectContaining({ shortCode: 'test2' })
        ])
      );
    });

    it('should increment click count', async () => {
      const urlData = {
        originalUrl: 'https://example.com/click-test',
        shortCode: 'click-test',
        clickCount: 0
      };

      const createdUrl = await database.createUrl(urlData);
      
      // Increment click count
      const updatedUrl = await database.incrementClickCount(urlData.shortCode);
      
      expect(updatedUrl?.clickCount).toBe(createdUrl.clickCount + 1);
      
      // Increment again
      const updatedAgain = await database.incrementClickCount(urlData.shortCode);
      expect(updatedAgain?.clickCount).toBe(createdUrl.clickCount + 2);
    });

    it('should delete URLs', async () => {
      const urlData = {
        originalUrl: 'https://example.com/delete-test',
        shortCode: 'delete-test',
        clickCount: 0
      };

      const createdUrl = await database.createUrl(urlData);
      
      // Verify it exists
      const existingUrl = await database.getUrlByShortCode(urlData.shortCode);
      expect(existingUrl).not.toBeNull();

      // Delete it
      const deleteResult = await database.deleteUrl(urlData.shortCode);
      expect(deleteResult).toBe(true);

      // Verify it's gone
      const deletedUrl = await database.getUrlByShortCode(urlData.shortCode);
      expect(deletedUrl).toBeNull();
    });

    it('should get URLs by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const urlData = {
        originalUrl: 'https://example.com/date-test',
        shortCode: 'date-test',
        clickCount: 0
      };

      await database.createUrl(urlData);

      const urlsInRange = await database.getUrlsByDateRange(yesterday, tomorrow);
      expect(urlsInRange.length).toBeGreaterThan(0);
      expect(urlsInRange).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ shortCode: 'date-test' })
        ])
      );
    });

    it('should get top URLs by click count', async () => {
      // Create URLs with different click counts
      const url1 = await database.createUrl({
        originalUrl: 'https://example.com/top1',
        shortCode: 'top1',
        clickCount: 10
      });

      const url2 = await database.createUrl({
        originalUrl: 'https://example.com/top2',
        shortCode: 'top2',
        clickCount: 5
      });

      const url3 = await database.createUrl({
        originalUrl: 'https://example.com/top3',
        shortCode: 'top3',
        clickCount: 15
      });

      const topUrls = await database.getTopUrls(2);
      
      expect(topUrls.length).toBe(2);
      // Should be ordered by click count descending
      expect(topUrls[0].clickCount).toBeGreaterThanOrEqual(topUrls[1].clickCount);
    });

    it('should get statistics', async () => {
      const stats = await database.getStats();
      
      expect(stats).toEqual({
        totalUrls: expect.any(Number),
        totalClicks: expect.any(Number),
        avgClicksPerUrl: expect.any(Number),
        urlsCreatedToday: expect.any(Number)
      });
    });
  });
});