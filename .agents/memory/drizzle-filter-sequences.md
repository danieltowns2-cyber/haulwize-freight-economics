---
name: Drizzle table filters and sequences
description: Drizzle Kit PostgreSQL push behavior when table filters are used in a shared public schema.
---

In this project, `drizzle-kit push` can still inspect public-schema sequences even when `tablesFilter` excludes their owning tables. A filtered-out table's sequence may then be treated as untracked and scheduled for removal. PostgreSQL can reject the drop because the sequence remains attached to the excluded table.

**Why:** A Supabase push created the freight tables, then failed while attempting to drop a sequence owned by a non-freight table. The push completed cleanly after the existing sequence was declared with `pgSequence` and the freight table filter remained in place.

**How to apply:** Before a filtered push against a shared PostgreSQL schema, inspect sequences owned by excluded tables. Preserve their sequence metadata in the Drizzle schema or use a migration strategy that does not attempt to remove them. Avoid `--force`, and verify both the managed tables and preserved sequence dependencies afterward.
