# Content API Reference

Public API endpoints for fetching site content. Designed for external sites (e.g., VPG) to consume content managed in the Assymo admin.

## Base URL

```
https://admin.assymo.be/api/content
```

## Authentication

No authentication required - these are public read-only endpoints.

## Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `site` | string | `assymo` | Site slug to fetch content for |

---

## Endpoints

### GET /homepage

Get the homepage for a site.

```
GET /api/content/homepage?site=vpg
```

**Response:**
```json
{
  "page": {
    "id": "...",
    "title": "Home",
    "slug": "home",
    "is_homepage": true,
    "header_image": { "url": "...", "alt": "..." },
    "sections": [...],
    "meta_title": "...",
    "meta_description": "..."
  }
}
```

---

### GET /page

Get a page by slug.

```
GET /api/content/page?slug=about&site=vpg
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `slug` | Yes | Page slug |
| `site` | No | Site slug (default: assymo) |

**Response:**
```json
{
  "page": {
    "id": "...",
    "title": "About Us",
    "slug": "about",
    "header_image": { "url": "...", "alt": "..." },
    "sections": [...],
    "meta_title": "...",
    "meta_description": "..."
  }
}
```

---

### GET /solutions

Get all solutions or a single solution by slug.

**All solutions:**
```
GET /api/content/solutions?site=vpg
```

**Single solution:**
```
GET /api/content/solutions?slug=project-name&site=vpg
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `slug` | No | If provided, returns single solution |
| `site` | No | Site slug (default: assymo) |

**Response (all):**
```json
{
  "solutions": [
    {
      "id": "...",
      "name": "Project Name",
      "subtitle": "...",
      "slug": "project-name",
      "header_image": { "url": "...", "alt": "..." },
      "order_rank": 1,
      "filters": [
        { "id": "...", "name": "Category", "slug": "category", "category_id": "..." }
      ]
    }
  ]
}
```

**Response (single):**
```json
{
  "solution": {
    "id": "...",
    "name": "Project Name",
    "subtitle": "...",
    "slug": "project-name",
    "header_image": { "url": "...", "alt": "..." },
    "sections": [...],
    "filters": [...],
    "meta_title": "...",
    "meta_description": "..."
  }
}
```

---

### GET /filters

Get filter categories with their filters (for solution filtering).

```
GET /api/content/filters?site=vpg
```

**Response:**
```json
{
  "categories": [
    {
      "id": "...",
      "name": "Type",
      "slug": "type",
      "order_rank": 1,
      "filters": [
        { "id": "...", "name": "Residential", "slug": "residential" },
        { "id": "...", "name": "Commercial", "slug": "commercial" }
      ]
    }
  ]
}
```

---

### GET /navigation

Get navigation links for header or footer.

```
GET /api/content/navigation?location=header&site=vpg
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `location` | Yes | `header` or `footer` |
| `site` | No | Site slug (default: assymo) |

**Response:**
```json
{
  "navigation": [
    {
      "id": "...",
      "label": "Solutions",
      "url": "/solutions",
      "location": "header",
      "order_rank": 1,
      "sub_items": [
        {
          "id": "...",
          "solution": {
            "name": "Project Name",
            "slug": "project-name",
            "header_image": { "url": "...", "alt": "..." }
          }
        }
      ]
    }
  ]
}
```

---

### GET /parameters

Get site parameters (contact info, social links).

```
GET /api/content/parameters?site=vpg
```

**Response:**
```json
{
  "parameters": {
    "id": "...",
    "site_id": "...",
    "address": "Street 123, City",
    "phone": "+32 123 456 789",
    "email": "info@vpg.be",
    "instagram": "https://instagram.com/vpg",
    "facebook": "https://facebook.com/vpg",
    "vat_number": "BE 0123.456.789"
  }
}
```

---

## Error Responses

**404 Not Found:**
```json
{ "error": "Page not found" }
```

**400 Bad Request:**
```json
{ "error": "Slug parameter is required" }
```

**500 Internal Server Error:**
```json
{ "error": "Internal server error" }
```

---

## Usage Example (Next.js)

```typescript
// lib/content.ts
const API_BASE = process.env.CONTENT_API_URL || 'https://admin.assymo.be/api/content';
const SITE = 'vpg';

export async function getHomepage() {
  const res = await fetch(`${API_BASE}/homepage?site=${SITE}`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.page;
}

export async function getPage(slug: string) {
  const res = await fetch(`${API_BASE}/page?slug=${slug}&site=${SITE}`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.page;
}

export async function getSolutions() {
  const res = await fetch(`${API_BASE}/solutions?site=${SITE}`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.solutions;
}

export async function getNavigation(location: 'header' | 'footer') {
  const res = await fetch(`${API_BASE}/navigation?location=${location}&site=${SITE}`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.navigation;
}

export async function getSiteParameters() {
  const res = await fetch(`${API_BASE}/parameters?site=${SITE}`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.parameters;
}
```

---

## Cache Invalidation

Content is cached for 1 hour on the API side. When content is updated in the admin, cache tags are revalidated. External sites should use appropriate caching strategies (e.g., Next.js `revalidate` or ISR).
