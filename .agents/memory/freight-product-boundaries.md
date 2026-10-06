---
name: Freight product boundaries
description: User-defined separation from the accounting ERP and mailbox sender requirements.
---

The Freight Rate Calculator is a standalone public multi-company product. Keep the existing accounting ERP module unchanged; this app uses manually entered costs and never posts general-ledger entries.

**Why:** The user said, “Make it it's own web app. Do not remove it from the accounting erp, make a copy.”

**How to apply:** Do not couple the calculator to the ERP or introduce accounting posting behavior.

Quote emails must come from the user's own email account. Support Gmail/Google Workspace and Microsoft 365/Outlook through per-user mailbox authorization; a shared Resend sender does not meet the requirement.

**Why:** The user explicitly required emails to originate from the user's account and selected both Google and Microsoft mailbox providers.

**How to apply:** Keep mailbox authorization scoped to the user and company. Do not replace it with a workspace owner's mail connection or an app-wide sender with only Reply-To changed.

The user wants Supabase PostgreSQL as the database and the Replit backend to serve the public website at haulwizeeconomics.com (with and without www).

**Why:** The user explicitly requested an external Supabase schema push and separately configurable frontend API hosting.

**How to apply:** Confirm the actual database target before any schema write. Do not treat Replit's runtime-managed database connection as the intended Supabase target without verification.
