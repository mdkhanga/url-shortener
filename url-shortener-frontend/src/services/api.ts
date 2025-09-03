import { ShortenRequest, ShortenResponse, UrlStats } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async shortenUrl(data: ShortenRequest): Promise<ShortenResponse> {
    return this.request<ShortenResponse>('/api/shorten', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUrlStats(shortCode: string): Promise<UrlStats> {
    return this.request<UrlStats>(`/api/stats/${shortCode}`);
  }

  async getAllUrls(): Promise<any[]> {
    return this.request<any[]>('/api/urls');
  }

  async deleteUrl(shortCode: string): Promise<void> {
    return this.request<void>(`/api/urls/${shortCode}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();