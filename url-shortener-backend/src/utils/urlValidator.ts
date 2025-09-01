import validator from 'validator';

export class UrlValidator {
  static isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Check if it's a valid URL format
    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      return false;
    }

    // Additional checks
    try {
      const urlObj = new URL(url);
      
      // Prevent localhost and private IPs (optional security measure)
      const hostname = urlObj.hostname;
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slashes and normalize
      return urlObj.toString().replace(/\/$/, '');
    } catch {
      return url;
    }
  }
}