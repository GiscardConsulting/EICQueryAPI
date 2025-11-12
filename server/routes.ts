import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { eicRefreshService } from "./eicRefreshService";

function generateApiDocs(baseUrl: string, lastRefresh: string | null): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EIC Code API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem 0; margin-bottom: 2rem; }
    header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    header p { font-size: 1.1rem; opacity: 0.9; }
    .content { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h2 { color: #667eea; margin: 2rem 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #667eea; }
    h3 { color: #764ba2; margin: 1.5rem 0 0.5rem 0; }
    .endpoint { background: #f8f9fa; padding: 1.5rem; margin: 1rem 0; border-radius: 6px; border-left: 4px solid #667eea; }
    .method { 
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.875rem;
      margin-right: 0.5rem;
    }
    .get { background: #28a745; color: white; }
    .post { background: #007bff; color: white; }
    .path { font-family: 'Monaco', 'Consolas', monospace; font-size: 1.1rem; color: #333; }
    pre { 
      background: #2d2d2d; 
      color: #f8f8f2; 
      padding: 1rem; 
      border-radius: 4px; 
      overflow-x: auto;
      margin: 1rem 0;
      font-size: 0.9rem;
    }
    code { font-family: 'Monaco', 'Consolas', monospace; }
    .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
    .badge { 
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: #28a745;
      color: white;
      border-radius: 3px;
      font-size: 0.8rem;
      margin-left: 0.5rem;
    }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: 600; color: #667eea; }
    .footer { text-align: center; padding: 2rem; color: #666; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>EIC Code API Documentation</h1>
      <p>Query and validate ENTSOE European Energy Identification Codes</p>
    </div>
  </header>

  <div class="container">
    <div class="content">
      ${lastRefresh ? `<div class="info-box" style="margin-bottom: 2rem;">
        <strong>Last Data Refresh:</strong> ${new Date(lastRefresh).toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        })}
      </div>` : ''}
      <section>
        <h2>Endpoints</h2>

        <div class="endpoint">
          <h3><span class="method get">GET</span><span class="path">/api/eic/:code</span></h3>
          <p>Query EIC code by exact code match.</p>
          
          <h4>Parameters</h4>
          <table>
            <tr><th>Name</th><th>Type</th><th>Description</th></tr>
            <tr><td>code</td><td>string</td><td>The exact EIC code (e.g., 10X1001A1001A094)</td></tr>
          </table>

          <h4>Example Request</h4>
<pre>curl ${baseUrl}/api/eic/10X1001A1001A094</pre>

          <h4>Example Response (Found)</h4>
<pre>{
  "data": {
    "eicCode": "10X1001A1001A094",
    "eicDisplayName": "ELIA",
    "eicLongName": "Elia Transmission Belgium",
    "eicParent": null,
    "eicStatus": "Active",
    "marketParticipantIsoCountryCode": "BE",
    "marketParticipantVatCode": "BE0731852231",
    "eicTypeFunctionList": "System Operator",
    "type": "X"
  },
  "metadata": {
    "lastRefresh": "2025-11-12T10:15:52.530Z",
    "totalRecords": 14481
  }
}</pre>

          <h4>Example Response (Not Found)</h4>
<pre>{
  "data": null,
  "metadata": {
    "lastRefresh": "2025-11-12T10:15:52.530Z",
    "totalRecords": 14481
  }
}</pre>
        </div>

        <div class="endpoint">
          <h3><span class="method get">GET</span><span class="path">/api/eic/search</span><span class="badge">Max 100 results</span></h3>
          <p>Search EIC codes by name (case-insensitive partial match).</p>
          
          <h4>Query Parameters</h4>
          <table>
            <tr><th>Name</th><th>Type</th><th>Description</th></tr>
            <tr><td>name</td><td>string</td><td>Search term (matches display name or long name)</td></tr>
          </table>

          <h4>Example Request</h4>
<pre>curl "${baseUrl}/api/eic/search?name=ELIA"</pre>

          <h4>Example Response (Matches Found)</h4>
<pre>{
  "data": [
    {
      "eicCode": "10X1001A1001A094",
      "eicDisplayName": "ELIA",
      "eicLongName": "Elia Transmission Belgium",
      ...
    }
  ],
  "metadata": {
    "lastRefresh": "2025-11-12T10:15:52.530Z",
    "totalRecords": 14481,
    "matchCount": 14,
    "query": "ELIA"
  }
}</pre>

          <h4>Example Response (No Matches)</h4>
<pre>{
  "data": [],
  "metadata": {
    "lastRefresh": "2025-11-12T10:15:52.530Z",
    "totalRecords": 14481,
    "matchCount": 0,
    "query": "NONEXISTENT"
  }
}</pre>
        </div>

        <div class="endpoint">
          <h3><span class="method get">GET</span><span class="path">/api/status</span></h3>
          <p>Get system health and database status.</p>

          <h4>Example Request</h4>
<pre>curl ${baseUrl}/api/status</pre>

          <h4>Example Response</h4>
<pre>{
  "status": "operational",
  "database": {
    "totalEicCodes": 14481,
    "lastRefresh": "2025-11-12T10:15:52.530Z",
    "etag": "present"
  },
  "refresh": {
    "isRefreshing": false,
    "schedule": "Every 15 minutes"
  }
}</pre>
        </div>
      </section>

      <section>
        <h2>HTTP Status Codes</h2>
        <table>
          <tr><th>Status Code</th><th>Description</th></tr>
          <tr><td>200</td><td>Success - Request completed successfully (includes cases where no data is found)</td></tr>
          <tr><td>400</td><td>Bad Request - Missing or invalid parameters</td></tr>
          <tr><td>500</td><td>Internal Server Error - Server-side error occurred</td></tr>
        </table>
        <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
          <strong>Note:</strong> When an EIC code is not found or search returns no matches, 
          the API returns 200 with <code>data: null</code> or <code>data: []</code> respectively.
        </p>
      </section>

      <section>
        <h2>Data Fields</h2>
        <table>
          <tr><th>Field</th><th>Description</th></tr>
          <tr><td>eicCode</td><td>Unique EIC identifier</td></tr>
          <tr><td>eicDisplayName</td><td>Short display name</td></tr>
          <tr><td>eicLongName</td><td>Full legal name</td></tr>
          <tr><td>eicParent</td><td>Parent EIC code (if applicable)</td></tr>
          <tr><td>eicResponsibleParty</td><td>Responsible party code</td></tr>
          <tr><td>eicStatus</td><td>Status (Active/Inactive)</td></tr>
          <tr><td>marketParticipantPostalCode</td><td>Postal code</td></tr>
          <tr><td>marketParticipantIsoCountryCode</td><td>ISO country code</td></tr>
          <tr><td>marketParticipantVatCode</td><td>VAT number</td></tr>
          <tr><td>eicTypeFunctionList</td><td>Function/role description</td></tr>
          <tr><td>type</td><td>EIC type indicator</td></tr>
        </table>
      </section>
    </div>
  </div>
</body>
</html>`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/", async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const metadata = await storage.getRefreshMetadata();
    res.setHeader("Content-Type", "text/html");
    res.send(generateApiDocs(baseUrl, metadata?.lastRefresh?.toISOString() || null));
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

  app.get("/api/eic/:code", async (req, res) => {
    try {
      const { code } = req.params;
      
      if (!code) {
        return res.status(400).json({ error: "EIC code is required" });
      }

      const eicCode = await storage.getEicByCode(code);
      const metadata = await storage.getRefreshMetadata();

      return res.json({
        data: eicCode || null,
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
