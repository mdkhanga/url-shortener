# URL Shortener Backend - Setup & Testing Guide

## Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn package manager
- postgres database


### 1. Build and Start

```bash
# Build the project
npm run build

# Start in development mode (with auto-reload)
npm run dev

# Or start in production mode
npm start
```

The server will start on `http://localhost:3000`

---

##  Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

### API Documentation

```bash
curl http://localhost:3000/api
```

---

## 📝 API Endpoints Testing

### 1. Create a Short URL

**Basic URL Shortening:**
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.google.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "originalUrl": "https://www.google.com",
    "shortCode": "abc123",
    "shortUrl": "http://localhost:3000/abc123",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**With Custom Short Code:**
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com",
    "customCode": "github"
  }'
```

**Error Cases to Test:**

Invalid URL:
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "invalid-url"}'
```

Duplicate custom code:
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "customCode": "github"
  }'
```

### 2. Redirect to Original URL

**Using Browser:**
```
http://localhost:3000/abc123
```
This should redirect to the original URL.

**Using curl (to see redirect):**
```bash
curl -I http://localhost:3000/abc123
```

**Expected Response:**
```
HTTP/1.1 301 Moved Permanently
Location: https://www.google.com
```

**Test 404 for invalid short code:**
```bash
curl http://localhost:3000/invalid-code
```

### 3. Get All URLs

```bash
curl http://localhost:3000/api/urls
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "originalUrl": "https://www.google.com",
      "shortCode": "abc123",
      "clickCount": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "shortUrl": "http://localhost:3000/abc123"
    }
  ],
  "message": "Found 1 URLs"
}
```

### 4. Get URL Statistics

```bash
curl http://localhost:3000/api/stats/abc123
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "originalUrl": "https://www.google.com",
    "shortCode": "abc123",
    "clickCount": 5,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "shortUrl": "http://localhost:3000/abc123"
  }
}
```

### 5. Delete a URL

```bash
curl -X DELETE http://localhost:3000/api/urls/abc123
```

**Expected Response:**
```json
{
  "success": true,
  "message": "URL deleted successfully"
}
```

