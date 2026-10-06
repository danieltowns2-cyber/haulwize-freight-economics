import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response, RequestHandler } from "express";
import { and, asc, eq } from "drizzle-orm";
import { auditLogTable, companiesTable, db, membershipsTable } from "@workspace/db";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type CompanyContext = {
  userId: string;
  companyId: number;
  role: string;
  member: typeof membershipsTable.$inferSelect;
  company: typeof companiesTable.$inferSelect;
};

export function userIdOf(req: Request) {
  const auth = getAuth(req);
  const id = auth?.userId || auth?.sessionClaims?.userId;
  if (typeof id !== "string" || !id) throw new HttpError(401, "Sign in to continue.");
  return id;
}

export async function identityOf(req: Request) {
  const userId = userIdOf(req);
  const user = await clerkClient.users.getUser(userId);
  const primary = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  if (!primary || primary.verification?.status !== "verified") {
    throw new HttpError(403, "Verify your email address before using the workspace.");
  }
  const email = primary.emailAddress.toLowerCase();
  const allowIds = (process.env.PLATFORM_ADMIN_USER_IDS || "").split(",").map((s) => s.trim());
  const allowEmails = (process.env.PLATFORM_ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase());
  const isPlatformAdmin = user.privateMetadata?.platformAdmin === true ||
    allowIds.includes(userId) || allowEmails.includes(email);
  return { userId, email, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null, isPlatformAdmin };
}

export async function contextOf(req: Request, write = false, ownerOnly = false): Promise<CompanyContext> {
  const userId = userIdOf(req);
  const header = req.get("x-company-id");
  const selectedId = header ? Number(header) : null;
  if (header && (!Number.isInteger(selectedId) || Number(selectedId) < 1)) {
    throw new HttpError(400, "Invalid company selection.");
  }
  const conditions = [
    eq(membershipsTable.userId, userId),
    eq(membershipsTable.active, true),
  ];
  if (selectedId) conditions.push(eq(membershipsTable.companyId, selectedId));
  const [record] = await db.select({ member: membershipsTable, company: companiesTable })
    .from(membershipsTable)
    .innerJoin(companiesTable, eq(companiesTable.id, membershipsTable.companyId))
    .where(and(...conditions)).orderBy(asc(membershipsTable.createdAt)).limit(1);
  if (!record) throw new HttpError(409, "Create a company or accept a teammate invitation first.");
  if (record.company.isDisabled) throw new HttpError(403, "This company account is disabled.");
  if (write && record.member.role === "Viewer") throw new HttpError(403, "Viewers have read-only access.");
  if (ownerOnly && record.member.role !== "Owner") throw new HttpError(403, "Only the company owner can do that.");
  return { userId, companyId: record.company.id, role: record.member.role, ...record };
}

export async function adminOf(req: Request) {
  const identity = await identityOf(req);
  if (!identity.isPlatformAdmin) throw new HttpError(403, "Platform administrator access is required.");
  return identity;
}

export async function audit(
  context: { userId: string; companyId?: number | null },
  action: string,
  entityType: string,
  entityId?: string | number,
  details: Record<string, unknown> = {},
) {
  await db.insert(auditLogTable).values({
    companyId: context.companyId ?? null,
    actorUserId: context.userId,
    action,
    entityType,
    entityId: entityId == null ? null : String(entityId),
    details,
  });
}

export function handle(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.status).json({ error: error.message });
      } else if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        res.status(400).json({ error: "Check the entered values.", details: "issues" in error ? error.issues : [] });
      } else {
        req.log.error({ err: error }, "Freight API request failed");
        res.status(500).json({ error: "The request could not be completed. Please try again." });
      }
    }
  };
}

const throttle = new Map<string, number[]>();
export function limitUser(userId: string, action: string, max: number, windowMs: number) {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const recent = (throttle.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= max) throw new HttpError(429, "Too many requests. Please wait and try again.");
  recent.push(now);
  throttle.set(key, recent);
  if (throttle.size > 10_000) {
    for (const [entry, times] of throttle) if (!times.some((time) => now - time < windowMs)) throttle.delete(entry);
  }
}
