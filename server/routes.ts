import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { eicRefreshService } from "./eicRefreshService";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/eic/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ error: "EIC code is required" });
      }

      const eicCode = await storage.getEicByCode(code);
      
      if (!eicCode) {
        return res.status(404).json({ error: "EIC code not found" });
      }

      const metadata = await storage.getRefreshMetadata();

      return res.json({
        data: eicCode,
        metadata: {
          lastRefresh: metadata?.lastRefresh,
          totalRecords: metadata?.totalRecords,
        },
      });
    } catch (error) {
      console.error("Error fetching EIC code:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/eic/search", async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Search parameter 'name' is required" });
      }

      const results = await storage.searchEicByName(name);
      const metadata = await storage.getRefreshMetadata();

      return res.json({
        data: results,
        metadata: {
          lastRefresh: metadata?.lastRefresh,
          totalRecords: metadata?.totalRecords,
          matchCount: results.length,
          query: name,
        },
      });
    } catch (error) {
      console.error("Error searching EIC codes:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/status", async (req, res) => {
    try {
      const metadata = await storage.getRefreshMetadata();
      const totalCount = await storage.getTotalEicCount();
      const isRefreshing = eicRefreshService.getRefreshStatus();

      return res.json({
        status: "operational",
        database: {
          totalEicCodes: totalCount,
          lastRefresh: metadata?.lastRefresh,
          etag: metadata?.etag ? "present" : "none",
        },
        refresh: {
          isRefreshing,
          schedule: "Every 15 minutes",
        },
      });
    } catch (error) {
      console.error("Error fetching status:", error);
      return res.status(500).json({ 
        status: "error",
        error: "Failed to fetch status information" 
      });
    }
  });

  app.post("/api/refresh", async (req, res) => {
    try {
      const result = await eicRefreshService.refreshEicData();
      
      if (result.success) {
        return res.json({
          success: true,
          message: result.message,
          recordsProcessed: result.recordsProcessed,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Error triggering manual refresh:", error);
      return res.status(500).json({ 
        success: false,
        error: "Internal server error" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
