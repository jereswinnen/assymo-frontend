# Message Retention System

## Overview

The chatbot automatically deletes old conversations to ensure GDPR compliance and manage storage. Retention works at the **conversation level** - when a conversation expires, all messages in that session are deleted.

## Configuration

Set retention period in `src/config/chatbot.ts`:

```typescript
messageRetentionDays: 30  // Production: 30 days
messageRetentionDays: 1   // Testing: 1 day
```

## How It Works

### Conversation Expiry Logic

A conversation expires based on its **first message timestamp**:
- Day 1: User starts conversation → First message created
- Day 15: User continues same conversation → New messages added
- Day 31: Cleanup runs → **Entire conversation deleted** (first message is 30+ days old)

### Two-Layer System

**1. localStorage (Browser)**
- Location: `src/hooks/usePersistedMessages.ts:56-76`
- Timestamp set when first message is saved
- Checked on page load - expired conversations are removed
- Immediate cleanup (no waiting for cron)

**2. Database (Neon Postgres)**
- Location: `src/lib/rateLimitQueries.ts:85-97`
- Cron job runs daily at 3 AM UTC (`vercel.json`)
- Deletes all messages where session's first message is older than retention period
- Query groups by `session_id` and checks `MIN(created_at)`

## Testing Retention

To test cleanup works correctly:

1. Set `messageRetentionDays: 1` in config
2. Create test conversations
3. Wait 24+ hours
4. Check localStorage: Old conversations should be removed on page load
5. Check database: Trigger cron manually or wait for 3 AM UTC run

### Manual Cron Trigger

```bash
curl -X GET http://localhost:3000/api/cron/cleanup-chat \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Important Notes

- **Granularity**: Database cleanup runs once daily, so messages may persist up to ~48 hours
- **Session-based**: Each `session_id` is treated as one conversation
- **All or nothing**: Cannot delete individual messages - entire sessions are removed
- **GDPR compliance**: Ensures user data is not kept indefinitely
