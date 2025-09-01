import { Pool, PoolClient, QueryResult } from 'pg';
import { Url } from '../types';

export class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'url_shortener',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    });

    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS urls (
          id SERIAL PRIMARY KEY,
          original_url VARCHAR(2048) NOT NULL,
          short_code VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          click_count INTEGER DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
        CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at DESC);
      `;

      await this.pool.query(createTableQuery);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createUrl(url: Omit<Url, 'id' | 'createdAt'>): Promise<Url> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        INSERT INTO urls (original_url, short_code, click_count)
        VALUES ($1, $2, $3)
        RETURNING id, original_url, short_code, created_at, click_count
      `;

      const result: QueryResult = await client.query(query, [
        url.originalUrl,
        url.shortCode,
        url.clickCount
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at,
        clickCount: row.click_count
      };
    } finally {
      client.release();
    }
  }

  async getUrlByShortCode(shortCode: string): Promise<Url | null> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = 'SELECT * FROM urls WHERE short_code = $1';
      const result: QueryResult = await client.query(query, [shortCode]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at,
        clickCount: row.click_count
      };
    } finally {
      client.release();
    }
  }

  async getUrlById(id: number): Promise<Url | null> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = 'SELECT * FROM urls WHERE id = $1';
      const result: QueryResult = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at,
        clickCount: row.click_count
      };
    } finally {
      client.release();
    }
  }

  async getAllUrls(limit: number = 100, offset: number = 0): Promise<{urls: Url[], total: number}> {
    const client: PoolClient = await this.pool.connect();
    try {
      // Get total count
      const countQuery = 'SELECT COUNT(*) FROM urls';
      const countResult: QueryResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const query = `
        SELECT * FROM urls 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result: QueryResult = await client.query(query, [limit, offset]);

      const urls = result.rows.map(row => ({
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at,
        clickCount: row.click_count
      }));

      return { urls, total };
    } finally {
      client.release();
    }
  }

  async incrementClickCount(shortCode: string): Promise<Url | null> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        UPDATE urls 
        SET click_count = click_count + 1 
        WHERE short_code = $1
        RETURNING id, original_url, short_code, created_at, click_count
      `;

      const result: QueryResult = await client.query(query, [shortCode]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at,
        clickCount: row.click_count
      };
    } finally {
      client.release();
    }
  }

  async deleteUrl(shortCode: string): Promise<boolean> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = 'DELETE FROM urls WHERE short_code = $1';
      const result: QueryResult = await client.query(query, [shortCode]);
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async getUrlsByDateRange(startDate: Date, endDate: Date): Promise<Url[]> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM urls 
        WHERE created_at >= $1 AND created_at <= $2
        ORDER BY created_at DESC
      `;

      const result: QueryResult = await client.query(query, [startDate, endDate]);

      return result.rows.map(row => ({
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at,
        clickCount: row.click_count
      }));
    } finally {
      client.release();
    }
  }

  async getTopUrls(limit: number = 10): Promise<Url[]> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM urls 
        ORDER BY click_count DESC, created_at DESC
        LIMIT $1
      `;

      const result: QueryResult = await client.query(query, [limit]);

      return result.rows.map(row => ({
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        createdAt: row.created_at,
        clickCount: row.click_count
      }));
    } finally {
      client.release();
    }
  }

  async getStats(): Promise<{
    totalUrls: number;
    totalClicks: number;
    avgClicksPerUrl: number;
    urlsCreatedToday: number;
  }> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT 
          COUNT(*) as total_urls,
          COALESCE(SUM(click_count), 0) as total_clicks,
          COALESCE(AVG(click_count), 0) as avg_clicks_per_url,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as urls_created_today
        FROM urls
      `;

      const result: QueryResult = await client.query(query);
      const row = result.rows[0];

      return {
        totalUrls: parseInt(row.total_urls),
        totalClicks: parseInt(row.total_clicks),
        avgClicksPerUrl: parseFloat(row.avg_clicks_per_url),
        urlsCreatedToday: parseInt(row.urls_created_today)
      };
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client: PoolClient = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new Database();
