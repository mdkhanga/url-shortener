import { UrlValidator} from '../src/utils/urlValidator';

describe('isValidUrl', () => {
  
  it('should return false for invalid URL formats', () => {
    expect(UrlValidator.isValidUrl('not-a-url')).toBe(false);
    expect(UrlValidator.isValidUrl('ftp://example.com')).toBe(false); // Wrong protocol
    expect(UrlValidator.isValidUrl('example.com')).toBe(false); // Missing protocol
    expect(UrlValidator.isValidUrl('https://')).toBe(false); // Missing domain
  });

  it('should return false for localhost and private IP addresses', () => {
    expect(UrlValidator.isValidUrl('https://localhost')).toBe(false);
    expect(UrlValidator.isValidUrl('https://127.0.0.1')).toBe(false);
    expect(UrlValidator.isValidUrl('https://192.168.1.1')).toBe(false);
    expect(UrlValidator.isValidUrl('https://10.0.0.1')).toBe(false);
    expect(UrlValidator.isValidUrl('https://172.16.0.1')).toBe(false);
  });

  it('should return true for valid public URLs', () => {
    expect(UrlValidator.isValidUrl('https://example.com')).toBe(true);
    expect(UrlValidator.isValidUrl('https://www.example.com')).toBe(true);
    expect(UrlValidator.isValidUrl('https://subdomain.example.com/path?query=param')).toBe(true);
    expect(UrlValidator.isValidUrl('https://example.com:8080')).toBe(true);
  });
});