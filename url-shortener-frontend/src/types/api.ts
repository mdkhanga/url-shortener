export interface ShortenRequest {
  url: string;
  customCode?: string;
}

export interface ShortenResponse {
  success: boolean;
  data?: {
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    createdAt: string;
  };
  error?: string;
}

export interface UrlStats {
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
}

export interface ApiError {
  message: string;
  status?: number;
}