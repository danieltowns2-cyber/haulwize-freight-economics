import type { CorsOptions } from "cors";

const allowedOrigins = new Set([
  "https://www.haulwizeeconomics.com",
  "https://haulwizeeconomics.com",
  "https://trucking-rate-calculator-app.replit.app",
]);

// Exact workspace/deployment hosts only; never allow arbitrary *.replit.dev hosts.
for (const host of [
  process.env.REPLIT_DEV_DOMAIN,
  ...(process.env.REPLIT_DOMAINS ?? "").split(","),
]) {
  if (host?.trim()) allowedOrigins.add(`https://${host.trim()}`);
}

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    // Local development tooling, never enabled in production.
    if (process.env.NODE_ENV !== "production") {
      try {
        const url = new URL(origin);
        if (["http:", "https:"].includes(url.protocol) &&
            ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
          callback(null, true);
          return;
        }
      } catch { /* Deny malformed origins. */ }
    }
    callback(null, false);
  },
};
