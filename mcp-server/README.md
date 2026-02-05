# Assymo Admin MCP Server

MCP (Model Context Protocol) server for managing Assymo CMS content via Claude Code.

## Setup

### 1. Install dependencies

```bash
cd mcp-server
pnpm install
```

### 2. Build

```bash
pnpm build
```

### 3. Configure in Claude Code

Add to your Claude Code MCP settings (`~/.claude/claude_code_config.json`):

```json
{
  "mcpServers": {
    "assymo-admin": {
      "command": "node",
      "args": ["/path/to/assymo-frontend/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "your-neon-database-url"
      }
    }
  }
}
```

Replace `/path/to/assymo-frontend` with the actual path to the project.

## Required Environment Variables

- `DATABASE_URL` - Neon Postgres connection string (same as used by the main app)

## Available Tools

### `list_sites`

Lists all available sites in the Assymo CMS with their IDs, names, and slugs.

### `set_site`

Sets the current site context. Required before using any site-scoped tools.

Parameters:
- `siteId` (string, required) - The UUID of the site to set as current context

## Development

```bash
# Watch mode for development
pnpm dev

# Build once
pnpm build

# Run directly (requires DATABASE_URL env var)
DATABASE_URL="..." pnpm start
```

## Architecture

- **db.ts** - Database connection using `@neondatabase/serverless`
- **context.ts** - Site context management (tracks current site for scoped operations)
- **index.ts** - MCP server entry point with tool registrations
- **tools/** - Directory for additional tool files (to be added in future phases)
