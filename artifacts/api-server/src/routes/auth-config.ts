import { Router, type IRouter } from "express";
import { GetAuthConfigResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/auth/config", (_req, res): void => {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  const isProductionKey = publishableKey?.startsWith("pk_live_") ?? false;

  if (!publishableKey || (process.env.NODE_ENV === "production" && !isProductionKey)) {
    res.status(503).json({ error: "Production authentication is not configured." });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.json(GetAuthConfigResponse.parse({ publishableKey }));
});

export default router;
