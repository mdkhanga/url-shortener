// src/components/UrlShortenerApp.tsx
import React, { useState } from 'react';
import { Copy, Link, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Types
interface ShortenResponse {
  success: boolean;
  data?: {
    originalUrl: string;
    shortCode: string;
    shortUrl: string;
    createdAt: string;
  };
  error?: string;
}

interface ApiError {
  message: string;
  status?: number;
}

function UrlShortenerApp() {
  const [url, setUrl] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const shortenUrl = async (originalUrl: string, customCode?: string): Promise<ShortenResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: originalUrl,
        customCode: customCode || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setResult({
        success: false,
        error: 'Please enter a URL to shorten'
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setResult({
        success: false,
        error: 'Please enter a valid URL (including http:// or https://)'
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      const response = await shortenUrl(url.trim(), customCode.trim());
      setResult(response);
      
      // Clear form on success
      if (response.success) {
        setUrl('');
        setCustomCode('');
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReset = () => {
    setUrl('');
    setCustomCode('');
    setResult(null);
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Link className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">URL Shortener</h1>
            <p className="text-gray-600">Transform long URLs into short, shareable links</p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="space-y-6">
              {/* URL Input */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter the URL to shorten:
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/very-long-url..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                  disabled={loading}
                />
              </div>

              {/* Custom Code Input */}
              <div>
                <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom short code (optional):
                </label>
                <input
                  type="text"
                  id="customCode"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="my-custom-link"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  3-20 characters, alphanumeric only
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !url.trim()}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Shortening...
                    </>
                  ) : (
                    'Shorten'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Result Section */}
          {result && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              {result.success && result.data ? (
                /* Success Result */
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Success! Here is your short URL
                  </h2>
                  
                  {/* Original URL */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Original URL:</p>
                    <p className="text-gray-800 break-all">{result.data.originalUrl}</p>
                  </div>

                  {/* Short URL */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Short URL:</p>
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <Link className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <a
                        href={result.data.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-indigo-600 hover:text-indigo-800 font-medium break-all"
                      >
                        {result.data.shortUrl}
                      </a>
                      <button
                        onClick={() => copyToClipboard(result.data!.shortUrl)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex-shrink-0"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="text-sm text-gray-500">
                    <p>Short code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{result.data.shortCode}</span></p>
                    <p className="mt-1">Created: {new Date(result.data.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                /* Error Result */
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Error
                  </h2>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{result.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlShortenerApp;