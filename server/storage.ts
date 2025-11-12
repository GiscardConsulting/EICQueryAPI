import { 
  eicCodes, 
  refreshMetadata,
  type EicCode, 
  type InsertEicCode,
  type RefreshMetadata,
  type InsertRefreshMetadata
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  getEicByCode(code: string): Promise<EicCode | undefined>;
  searchEicByName(name: string): Promise<EicCode[]>;
  upsertEicCodes(codes: InsertEicCode[]): Promise<void>;
  getRefreshMetadata(): Promise<RefreshMetadata | undefined>;
  updateRefreshMetadata(metadata: InsertRefreshMetadata): Promise<RefreshMetadata>;
  getTotalEicCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getEicByCode(code: string): Promise<EicCode | undefined> {
    const [eicCode] = await db
      .select()
      .from(eicCodes)
      .where(eq(eicCodes.eicCode, code));
    return eicCode || undefined;
  }

  async searchEicByName(name: string): Promise<EicCode[]> {
    const results = await db
      .select()
      .from(eicCodes)
      .where(
        or(
          ilike(eicCodes.eicDisplayName, `%${name}%`),
          ilike(eicCodes.eicLongName, `%${name}%`)
        )
      )
      .limit(100);
    return results;
  }

  async upsertEicCodes(codes: InsertEicCode[]): Promise<void> {
    if (codes.length === 0) return;

    await db
      .insert(eicCodes)
      .values(codes)
      .onConflictDoUpdate({
        target: eicCodes.eicCode,
        set: {
          eicDisplayName: sql`EXCLUDED.eic_display_name`,
          eicLongName: sql`EXCLUDED.eic_long_name`,
          eicParent: sql`EXCLUDED.eic_parent`,
          eicResponsibleParty: sql`EXCLUDED.eic_responsible_party`,
          eicStatus: sql`EXCLUDED.eic_status`,
          marketParticipantPostalCode: sql`EXCLUDED.market_participant_postal_code`,
          marketParticipantIsoCountryCode: sql`EXCLUDED.market_participant_iso_country_code`,
          marketParticipantVatCode: sql`EXCLUDED.market_participant_vat_code`,
          eicTypeFunctionList: sql`EXCLUDED.eic_type_function_list`,
          type: sql`EXCLUDED.type`,
        },
      });
  }

  async getRefreshMetadata(): Promise<RefreshMetadata | undefined> {
    const [metadata] = await db
      .select()
      .from(refreshMetadata)
      .where(eq(refreshMetadata.id, "eic_csv"));
    return metadata || undefined;
  }

  async updateRefreshMetadata(data: InsertRefreshMetadata): Promise<RefreshMetadata> {
    const [metadata] = await db
      .insert(refreshMetadata)
      .values({
        id: "eic_csv",
        ...data,
      })
      .onConflictDoUpdate({
        target: refreshMetadata.id,
        set: {
          etag: data.etag,
          lastRefresh: data.lastRefresh,
          totalRecords: data.totalRecords,
        },
      })
      .returning();
    return metadata;
  }

  async getTotalEicCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eicCodes);
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
