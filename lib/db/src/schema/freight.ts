import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  pgSequence,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type CostBasisData = {
  expectedMonthlyMiles: number;
  fixedLines: Array<{
    id: string;
    name: string;
    monthlyAmount: number;
    note: string | null;
    position: number;
  }>;
  variableLines: Array<{
    id: string;
    name: string;
    amountPerMile: number;
    isFuel: boolean;
    position: number;
  }>;
  fuelPriceMode: "national" | "manual";
  manualFuelPrice: number;
  dieselPrice: number | null;
  dieselWeek: string | null;
  averageMpg: number;
  factoringPercent: number;
  dispatchPercent: number;
  targetMarginPercent: number;
};

export type ShipmentSnapshot = {
  capturedAt: string;
  costBasis: CostBasisData;
  fixedMonthly: number;
  fixedPerMile: number;
  variablePerMile: number;
  fuelPerMile: number;
  operatingCostPerMile: number;
  feesPercent: number;
  variableLines: CostBasisData["variableLines"];
};

// Preserve the existing sequence owned by the non-freight public table.
// Drizzle's table filter does not filter sequences during schema pushes.
export const haulwizeEconomicsIdSequence = pgSequence(
  "Haulwize Economics_id_seq",
  {
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: "9223372036854775807",
    cache: 1,
    cycle: false,
  },
);

export const companiesTable = pgTable("freight_companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mcNumber: text("mc_number"),
  dotNumber: text("dot_number"),
  isDisabled: boolean("is_disabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const membershipsTable = pgTable(
  "freight_memberships",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    role: text("role").notNull().default("Owner"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("freight_memberships_company_user").on(
      table.companyId,
      table.userId,
    ),
    index("freight_memberships_user").on(table.userId),
  ],
);

export const costBasesTable = pgTable(
  "freight_cost_bases",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .unique()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    config: jsonb("config").$type<CostBasisData>().notNull(),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("freight_cost_bases_company").on(table.companyId)],
);

export const shipmentsTable = pgTable(
  "freight_shipments",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    createdBy: text("created_by").notNull(),
    reference: text("reference").notNull(),
    date: date("shipment_date", { mode: "string" }).notNull(),
    equipment: text("equipment").notNull(),
    loadedMiles: doublePrecision("loaded_miles").notNull(),
    deadheadMiles: doublePrecision("deadhead_miles").notNull(),
    reeferPerDay: doublePrecision("reefer_per_day").notNull().default(0),
    reeferDays: doublePrecision("reefer_days").notNull().default(0),
    extrasCost: doublePrecision("extras_cost").notNull().default(0),
    brokerOffer: doublePrecision("broker_offer"),
    targetMarginPercent: doublePrecision("target_margin_percent").notNull(),
    stops: jsonb("stops").notNull().default([]),
    status: text("status").notNull().default("Estimate"),
    snapshot: jsonb("snapshot").$type<ShipmentSnapshot>().notNull(),
    calculation: jsonb("calculation").$type<Record<string, unknown>>().notNull(),
    actual: jsonb("actual").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("freight_shipments_company_date").on(table.companyId, table.date),
    index("freight_shipments_company_status").on(table.companyId, table.status),
  ],
);

export const invitationsTable = pgTable(
  "freight_invitations",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull(),
    createdBy: text("created_by").notNull(),
    acceptedBy: text("accepted_by"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("freight_invitations_company").on(table.companyId),
    uniqueIndex("freight_invitations_company_email").on(
      table.companyId,
      table.email,
    ),
  ],
);

export const auditLogTable = pgTable(
  "freight_audit_log",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").references(() => companiesTable.id, {
      onDelete: "cascade",
    }),
    actorUserId: text("actor_user_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("freight_audit_company_time").on(table.companyId, table.createdAt)],
);

export const marketBenchmarksTable = pgTable(
  "freight_market_benchmarks",
  {
    id: serial("id").primaryKey(),
    equipment: text("equipment").notNull(),
    ratePerMile: doublePrecision("rate_per_mile").notNull(),
    label: text("label").notNull(),
    source: text("source").notNull(),
    asOf: date("as_of", { mode: "string" }).notNull(),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("freight_market_source_equipment").on(
      table.source,
      table.equipment,
    ),
  ],
);

export const fuelPriceCacheTable = pgTable("freight_fuel_price_cache", {
  id: serial("id").primaryKey(),
  price: doublePrecision("price").notNull(),
  week: text("week").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mailboxConnectionsTable = pgTable(
  "freight_mailbox_connections",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    provider: text("provider").notNull(),
    email: text("email").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
    scopes: text("scopes").notNull(),
    connectedAt: timestamp("connected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("freight_mailbox_company_user_provider").on(
      table.companyId,
      table.userId,
      table.provider,
    ),
  ],
);

export const mailboxOauthStatesTable = pgTable(
  "freight_mailbox_oauth_states",
  {
    id: serial("id").primaryKey(),
    stateHash: text("state_hash").notNull().unique(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    provider: text("provider").notNull(),
    codeVerifier: text("code_verifier").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("freight_mailbox_oauth_state_expiry").on(table.expiresAt)],
);

export const quoteSendRequestsTable = pgTable(
  "freight_quote_send_requests",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companiesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    shipmentId: integer("shipment_id")
      .notNull()
      .references(() => shipmentsTable.id, { onDelete: "cascade" }),
    requestHash: text("request_hash").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("freight_quote_request_dedupe").on(
      table.companyId,
      table.userId,
      table.shipmentId,
      table.requestHash,
    ),
  ],
);
