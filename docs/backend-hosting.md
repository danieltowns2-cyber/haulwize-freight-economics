# Public frontend / Replit API configuration

- The API is mounted at `/api`. Liveness is `GET /api/healthz`.
  This endpoint does not verify database connectivity or business endpoint availability.
- For a separately hosted frontend, set the **build-time** variable
  `VITE_API_URL=https://trucking-rate-calculator-app.replit.app`.
  Use the backend origin only, without `/api`. Rebuild the frontend after changing it.
- Leave `VITE_API_URL` unset for the existing relative-path preview behavior.
- CORS permits both `https://www.haulwizeeconomics.com` and
  `https://haulwizeeconomics.com`, the existing published Replit origin, and the
  exact runtime-provided Replit domains. Arbitrary origins are not reflected.
- CORS alone does not configure cross-site Clerk sessions. Authenticated business
  requests need a valid session/token accepted by the backend.
- The runtime database client prefers `SUPABASE_DATABASE_URL`, preserving
  Replit's managed `DATABASE_URL` as an untouched fallback. The Drizzle push
  config requires `SUPABASE_DATABASE_URL` and never falls back to Replit's DB.
  Run `pnpm --filter @workspace/db run push` only after confirming connectivity.
  Do not use `push-force` against live data without reviewing destructive
  changes. Replit publishing does not migrate external Supabase databases.
- Do not place database credentials in frontend variables or commit them to Git.
- The current API router only mounts health checks; configuration is not a
  substitute for implementing and mounting the carrier business endpoints.
