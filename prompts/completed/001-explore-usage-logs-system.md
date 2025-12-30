<objective>
Research and document options for building a usage/activity logs system for super admins.

Create a concise decision document (~1-2 pages) that:
1. Helps decide whether this feature is worth building
2. Outlines conceptual implementation approaches if you proceed
</objective>

<context>
This is for the Assymo admin CMS - a Next.js 16 application with:
- Neon Postgres database
- Better Auth with roles: super_admin > admin > content_editor
- Multi-site architecture with site-scoped and global features
- Admin actions include: viewing, adding, editing, deleting content (pages, solutions, media, navigation, etc.)

@CLAUDE.md for full architecture overview
@src/lib/permissions/ for current role/permission system
</context>

<research>
Explore the codebase to understand:
- Current admin API routes in /api/admin/* (what actions could be logged)
- Existing database patterns (for schema inspiration)
- Auth session structure (what user data is available)
</research>

<deliverables>
Create a document covering:

**Part 1: Should You Build This?**
- What value does usage logging provide for a super admin?
- What's the effort vs. benefit trade-off?
- Are there simpler alternatives (e.g., Vercel logs, database triggers)?

**Part 2: Implementation Options (if yes)**
- 2-3 conceptual approaches with trade-offs
- What actions to log (CRUD on which resources)
- Storage considerations (same DB vs. separate, retention)
- Basic UI concept for viewing logs

Keep it concise - this is for decision-making, not a full spec.
</deliverables>

<output>
Save the document to: `./docs/exploration/usage-logs-system.md`
</output>

<success_criteria>
- Document helps make a clear go/no-go decision
- Implementation options are practical for this stack
- Trade-offs are honest about effort required
</success_criteria>
