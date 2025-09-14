# Convex URL Storage Service

This Convex service provides a simple, reactive database for storing and managing URLs with uniqueness constraints and metadata.

## 🚀 Quick Start

1. **Start the Convex development server:**
   ```bash
   cd apps/convex-service
   npx convex dev
   ```

2. **Access the Convex dashboard:**
   - Local: http://127.0.0.1:6790/?d=anonymous-winternal
   - Use `npx convex dashboard` to open it automatically

## 📊 Database Schema

### URLs Collection (`urls`)

Simple table for storing unique URLs with metadata:
- `url` (string): The URL itself - **unique**
- `title` (optional string): Title of the URL
- `description` (optional string): Description of the URL  
- `tags` (optional array): Tags for categorization
- `createdAt` (number): Creation timestamp
- `updatedAt` (number): Last update timestamp

**Indexes:**
- `by_url`: Unique index for fast URL lookups and duplicate prevention
- `by_created_at`: For chronological ordering

## 🔧 API Functions

### URL Management

```javascript
// Add a URL (with automatic uniqueness check)
const result = await convex.mutation(api.urls.addUrl, {
  url: "https://docs.example.com/api",
  title: "API Documentation", 
  description: "Complete API reference",
  tags: ["api", "reference", "docs"]
});

// Result includes:
// { id, url, existed: false, message: "URL added successfully" }
// { id, url, existed: true, message: "URL already exists, updated with new information" }

// Get all URLs
const urls = await convex.query(api.urls.getAllUrls, {
  limit: 50 // optional
});

// Check if URL exists
const check = await convex.query(api.urls.urlExists, {
  url: "https://docs.example.com/api"
});
// Returns: { exists: true/false, url: urlObject or null }

// Get URL by string
const url = await convex.query(api.urls.getUrlByString, {
  url: "https://docs.example.com/api"
});

// Search URLs by tags
const taggedUrls = await convex.query(api.urls.getUrlsByTags, {
  tags: ["api", "docs"],
  matchAll: false // true = match ALL tags, false = match ANY tag
});

// Update URL metadata
await convex.mutation(api.urls.updateUrl, {
  id: urlId,
  title: "Updated Title",
  tags: ["updated", "api"]
});

// Batch add URLs (useful for imports)
const batchResult = await convex.mutation(api.urls.batchAddUrls, {
  urls: [
    { url: "https://example1.com", title: "Example 1" },
    { url: "https://example2.com", title: "Example 2" },
    // ... more URLs
  ]
});
// Returns: { total: 2, added: 1, skipped: 1, results: [...] }
```

## 🔧 Key Features

- **Uniqueness Guaranteed**: URLs are automatically checked for duplicates
- **Real-time Updates**: All connected clients get live data updates  
- **Flexible Metadata**: Store titles, descriptions, and tags
- **Batch Operations**: Import multiple URLs efficiently
- **Tag-based Search**: Find URLs by single or multiple tags
- **Chronological Ordering**: URLs ordered by creation time

## 🚀 Deployment

### Local Development
```bash
npx convex dev
```

### Production Deployment
```bash
npx convex deploy
```

### Environment Variables
The service uses Convex's built-in authentication and deployment system. Configuration is stored in `.env.local`:

- `CONVEX_DEPLOYMENT`: Your deployment name
- `CONVEX_URL`: Your deployment URL

## 🔧 Integration Examples

### Web UI Integration
```javascript
// Add URL from user input
const addUrl = async (url, title) => {
  const result = await convex.mutation(api.urls.addUrl, {
    url,
    title,
    tags: ["user-added"]
  });
  
  if (result.existed) {
    console.log("URL already in database");
  } else {
    console.log("New URL added!");
  }
};

// Get all user URLs
const userUrls = await convex.query(api.urls.getUrlsByTags, {
  tags: ["user-added"]
});
```

### Development
Use the Convex dashboard to test mutations and queries interactively during development. The simple schema makes it easy to understand and debug your data.
