# Usage/Activity Logs System - Decision Document

## Part 1: Should You Build This?

### What Value Does Usage Logging Provide?

**For a super admin, activity logs answer:**
- "Who changed this content and when?" (accountability)
- "What did user X do in the last month?" (audit trail)
- "When was this page last edited?" (content freshness)
- "Is anyone using the newsletter feature?" (feature adoption)

**Realistic value assessment for Assymo:**
- **High value**: Troubleshooting ("Who deleted that page?"), user accountability with multiple editors
- **Medium value**: Understanding which features get used, identifying training needs
- **Low value**: Security forensics (Better Auth already has session logging), real-time monitoring

### Effort vs. Benefit Trade-off

| Approach | Effort | Benefit | Verdict |
|----------|--------|---------|---------|
| Full custom solution | 3-5 days | Complete control | Overkill for current needs |
| Lightweight table + middleware | 1-2 days | Good ROI | **Recommended if building** |
| Vercel logs only | 0 days | Basic visibility | Already have this |
| Postgres triggers | 1 day | Automatic capture | Complex to maintain |

### Simpler Alternatives

**1. Vercel Logs (already available)**
- Shows all API requests with timestamps
- Filter by endpoint (e.g., `/api/admin/content/pages`)
- Free with your plan, no code changes
- Limitation: No user context, 1-hour retention on free tier

**2. Better Auth Session Logs**
- Already tracks: login times, MFA events, session creation
- Good for: "When did this user last log in?"
- Limitation: No action-level detail

**3. `updated_at` Columns (already have)**
- Every content table has `updated_at`
- Shows when content changed
- Limitation: No "who" or "what changed"

### Recommendation

**Build if**: You have multiple active content editors and need accountability ("Who did what?").

**Skip if**: It's primarily you and one other admin - Vercel logs + `updated_at` timestamps are sufficient for now.

---

## Part 2: Implementation Options

If you decide to build, here are three approaches ranked by simplicity:

### Option A: Centralized Logging Middleware (Recommended)

**Concept**: Wrap `protectRoute()` to automatically log after successful mutations.

```typescript
// src/lib/activity-log.ts
export async function logActivity(ctx: PermissionContext, action: {
  type: 'create' | 'update' | 'delete' | 'view';
  resource: string;  // 'pages', 'solutions', 'media', etc.
  resourceId?: string;
  siteId?: string;
  metadata?: Record<string, unknown>;
}) {
  await sql`
    INSERT INTO activity_logs (user_id, user_name, action_type, resource, resource_id, site_id, metadata)
    VALUES (${ctx.user.id}, ${ctx.user.name}, ${action.type}, ${action.resource}, ${action.resourceId}, ${action.siteId}, ${JSON.stringify(action.metadata)})
  `;
}
```

**Usage in routes** (minimal change):
```typescript
// After successful DELETE in pages route:
await logActivity(ctx!, { type: 'delete', resource: 'pages', resourceId: id, siteId });
```

**Schema**:
```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action_type VARCHAR(20) NOT NULL,  -- create, update, delete, view
  resource VARCHAR(50) NOT NULL,     -- pages, solutions, media, users, etc.
  resource_id TEXT,
  site_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX activity_logs_user_idx ON activity_logs(user_id);
CREATE INDEX activity_logs_resource_idx ON activity_logs(resource, resource_id);
CREATE INDEX activity_logs_created_idx ON activity_logs(created_at DESC);
```

**Pros**: Simple, explicit, you control exactly what gets logged
**Cons**: Must add logging call to each route manually

---

### Option B: Database Triggers

**Concept**: Postgres triggers automatically log changes to tracked tables.

```sql
CREATE OR REPLACE FUNCTION log_table_changes() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    action_type,
    resource,
    resource_id,
    metadata
  ) VALUES (
    TG_OP,  -- INSERT, UPDATE, DELETE
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::TEXT,
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_audit AFTER INSERT OR UPDATE OR DELETE ON pages
FOR EACH ROW EXECUTE FUNCTION log_table_changes();
```

**Pros**: Automatic, catches all changes (even direct SQL)
**Cons**: No user context (triggers don't know who made the request), harder to debug, stores full row data (storage heavy)

---

### Option C: Next.js Middleware Approach

**Concept**: Intercept all `/api/admin/*` requests in middleware.

```typescript
// middleware.ts (extend existing)
if (pathname.startsWith('/api/admin/') && ['POST', 'PUT', 'DELETE'].includes(method)) {
  // Log after response
  response.headers.set('x-logged', 'true');
  await logActivity(...);
}
```

**Pros**: Centralized, no changes to routes
**Cons**: Middleware can't easily access request body or response data, harder to get resource context

---

### What Actions to Log

**Must log (mutations)**:
- Pages: create, update, delete, duplicate
- Solutions: create, update, delete, duplicate, reorder
- Media: upload, delete, update metadata
- Navigation: create, update, delete, reorder
- Users: create, update role, delete (super_admin only)
- Newsletters: create, send

**Consider logging**:
- Appointments: status changes, creation
- Filter categories: changes

**Skip logging**:
- GET/view requests (too noisy, use Vercel logs)
- Auth events (Better Auth handles this)
- Chatbot conversations (already logged in `chat_conversations`)

---

### Storage Considerations

**Same database (Neon Postgres)** - Recommended
- Simple: Same connection, same queries
- Retention: Add a cron job or scheduled function to delete logs > 90 days
- Size estimate: ~500 bytes/log * 100 actions/day * 90 days = ~4.5 MB

**Separate service** (e.g., Logflare, Axiom)
- Better for high-volume logging
- Overkill for this use case
- Adds operational complexity

---

### Basic UI Concept

Add a new admin page at `/admin/activity` (super_admin only):

**Features**:
1. Table view with columns: Date, User, Action, Resource, Details
2. Filters: By user, by resource type, date range
3. Link resource IDs to their edit pages when applicable

**Minimal implementation**:
```typescript
// src/app/admin/activity/page.tsx
const logs = await sql`
  SELECT * FROM activity_logs
  ORDER BY created_at DESC
  LIMIT 100
`;
```

---

## Summary Decision Matrix

| Factor | Build | Skip |
|--------|-------|------|
| Multiple active editors | x | |
| Need "who changed this" answers | x | |
| Compliance/audit requirements | x | |
| Single admin | | x |
| Vercel logs sufficient | | x |
| Time constraint (launch priority) | | x |

**If building**: Start with Option A (middleware helper) - 1 day to implement basic version, 1 more day for UI.
