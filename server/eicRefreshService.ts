import csvParser from "csv-parser";
import { Readable } from "stream";
import { storage } from "./storage";
import type { InsertEicCode } from "@shared/schema";

const CSV_URL = "https://eepublicdownloads.blob.core.windows.net/cio-lio/csv/X_eicCodes.csv";

interface CsvRow {
  EicCode: string;
  EicDisplayName: string;
  EicLongName: string;
  EicParent: string;
  EicResponsibleParty: string;
  EicStatus: string;
  MarketParticipantPostalCode: string;
  MarketParticipantIsoCountryCode: string;
  MarketParticipantVatCode: string;
  EicTypeFunctionList: string;
  type: string;
}

export class EicRefreshService {
  private isRefreshing = false;

  async refreshEicData(): Promise<{ success: boolean; message: string; recordsProcessed?: number }> {
    if (this.isRefreshing) {
      return { success: false, message: "Refresh already in progress" };
    }

    this.isRefreshing = true;

    try {
      console.log("[EIC Refresh] Starting refresh check...");
      
      const metadata = await storage.getRefreshMetadata();
      const currentEtag = metadata?.etag;

      const headers: Record<string, string> = {};
      if (currentEtag) {
        headers["If-None-Match"] = currentEtag;
      }

      const response = await fetch(CSV_URL, { headers });

      if (response.status === 304) {
        console.log("[EIC Refresh] No changes detected (304 Not Modified)");
        return { success: true, message: "Data is up to date (no changes detected)" };
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }

      const newEtag = response.headers.get("etag");
      const csvText = await response.text();

      console.log("[EIC Refresh] Parsing CSV data...");
      const records = await this.parseCsv(csvText);

      console.log(`[EIC Refresh] Upserting ${records.length} records to database...`);
      
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await storage.upsertEicCodes(batch);
      }

      await storage.updateRefreshMetadata({
        etag: newEtag || undefined,
        lastRefresh: new Date(),
        totalRecords: records.length,
      });

      console.log(`[EIC Refresh] Successfully refreshed ${records.length} EIC codes`);
      
      return { 
        success: true, 
        message: "Data refreshed successfully", 
        recordsProcessed: records.length 
      };
    } catch (error) {
      console.error("[EIC Refresh] Error:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  private parseCsv(csvText: string): Promise<InsertEicCode[]> {
    return new Promise((resolve, reject) => {
      const records: InsertEicCode[] = [];
      const stream = Readable.from(csvText);

      stream
        .pipe(csvParser({ separator: ";" }))
        .on("data", (row: CsvRow) => {
          records.push({
            eicCode: row.EicCode?.trim() || "",
            eicDisplayName: row.EicDisplayName?.trim() || null,
            eicLongName: row.EicLongName?.trim() || null,
            eicParent: row.EicParent?.trim() || null,
            eicResponsibleParty: row.EicResponsibleParty?.trim() || null,
            eicStatus: row.EicStatus?.trim() || null,
            marketParticipantPostalCode: row.MarketParticipantPostalCode?.trim() || null,
            marketParticipantIsoCountryCode: row.MarketParticipantIsoCountryCode?.trim() || null,
            marketParticipantVatCode: row.MarketParticipantVatCode?.trim() || null,
            eicTypeFunctionList: row.EicTypeFunctionList?.trim() || null,
            type: row.type?.trim() || null,
          });
        })
        .on("end", () => resolve(records))
        .on("error", (error) => reject(error));
    });
  }

  getRefreshStatus(): boolean {
    return this.isRefreshing;
  }
}

export const eicRefreshService = new EicRefreshService();
