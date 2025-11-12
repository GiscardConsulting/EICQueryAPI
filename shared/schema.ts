import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const eicCodes = pgTable("eic_codes", {
  eicCode: varchar("eic_code", { length: 255 }).primaryKey(),
  eicDisplayName: text("eic_display_name"),
  eicLongName: text("eic_long_name"),
  eicParent: text("eic_parent"),
  eicResponsibleParty: text("eic_responsible_party"),
  eicStatus: text("eic_status"),
  marketParticipantPostalCode: text("market_participant_postal_code"),
  marketParticipantIsoCountryCode: varchar("market_participant_iso_country_code", { length: 10 }),
  marketParticipantVatCode: text("market_participant_vat_code"),
  eicTypeFunctionList: text("eic_type_function_list"),
  type: varchar("type", { length: 10 }),
});

export const refreshMetadata = pgTable("refresh_metadata", {
  id: varchar("id").primaryKey().default("eic_csv"),
  etag: text("etag"),
  lastRefresh: timestamp("last_refresh", { withTimezone: true }),
  totalRecords: sql<number>`integer`.default(0),
});

export const insertEicCodeSchema = createInsertSchema(eicCodes);
export const insertRefreshMetadataSchema = createInsertSchema(refreshMetadata).omit({ id: true });

export type EicCode = typeof eicCodes.$inferSelect;
export type InsertEicCode = z.infer<typeof insertEicCodeSchema>;
export type RefreshMetadata = typeof refreshMetadata.$inferSelect;
export type InsertRefreshMetadata = z.infer<typeof insertRefreshMetadataSchema>;
