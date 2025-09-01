export interface Url {
  id?: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clickCount: number;
}

export interface CreateUrlRequest {
  url: string;
  customCode?: string;
}

export interface CreateUrlResponse {
  success: boolean;
  data?: {
    id: number;
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    createdAt: Date;
  };
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
