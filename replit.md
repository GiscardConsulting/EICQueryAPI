# EIC Code API Service

A minimalist REST API for querying ENTSOE EIC codes with automated refresh and persistent storage.

## Quick Start

**View Interactive Documentation:** Navigate to the root URL (`/`) in your browser for complete API documentation with examples.

## Overview

This service provides fast querying of European Energy Identification Codes (EIC) from ENTSOE, with:
- **Interactive HTML documentation** at the root path
- PostgreSQL database for persistent storage
- Automated CSV refresh every 15 minutes
- eTag-based conditional requests (only downloads when data changes)
- Fast search capabilities by code or name

## Architecture

### Database Schema

**eic_codes table:**
- Stores all 14,481+ EIC codes with their full metadata
- Primary key: `eicCode`
- Columns: display name, long name, parent, status, country, VAT code, type/function, etc.

**refresh_metadata table:**
- Tracks refresh status: eTag, last refresh timestamp, total records
- Enables eTag optimization to avoid unnecessary downloads

### Backend Services

**CSV Refresh Service** (`server/eicRefreshService.ts`):
- Downloads CSV from Azure Blob Storage
- Uses HTTP `If-None-Match` header with eTag for conditional requests
- Parses semicolon-separated CSV data
- Batch upserts 500 records at a time to database
- Updates metadata after successful refresh

**Cron Jobs** (`server/cronJobs.ts`):
- Runs refresh every 15 minutes: `*/15 * * * *`
- Initial refresh on server startup
- Prevents concurrent refresh operations

**API Routes** (`server/routes.ts`):
- `GET /` - Interactive API documentation (HTML)
- `GET /api/eic/:code` - Query by exact EIC code
- `GET /api/eic/search?name=X` - Search by name (case-insensitive)
- `GET /api/status` - Health check and system status
- `POST /api/refresh` - Trigger manual refresh

## API Documentation

**📚 For full interactive documentation, visit the root URL (`/`) in your browser.**

The following is a quick reference guide:

### Query by EIC Code

```bash
GET /api/eic/:code
```

**Example:**
```bash
curl http://localhost:5000/api/eic/10X1001A1001A094
```

**Response:**
```json
{
  "data": {
    "eicCode": "10X1001A1001A094",
    "eicDisplayName": "ELIA",
    "eicLongName": "Elia Transmission Belgium",
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
}
```

### Search by Name

```bash
GET /api/eic/search?name=SEARCH_TERM
```

**Example:**
```bash
curl "http://localhost:5000/api/eic/search?name=ELIA"
```

**Response:**
```json
{
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
}
```

### System Status

```bash
GET /api/status
```

**Response:**
```json
{
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
}
```

### Manual Refresh

```bash
POST /api/refresh
```

**Response (no changes):**
```json
{
  "success": true,
  "message": "Data is up to date (no changes detected)"
}
```

**Response (data updated):**
```json
{
  "success": true,
  "message": "Data refreshed successfully",
  "recordsProcessed": 14481
}
```

## Technology Stack

- **Backend:** Express.js with TypeScript
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Drizzle ORM
- **Scheduler:** node-cron
- **CSV Parsing:** csv-parser
- **Validation:** Zod

## Environment Variables

Required environment variables (automatically configured by Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)

## Data Source

CSV data is fetched from:
```
https://eepublicdownloads.blob.core.windows.net/cio-lio/csv/X_eicCodes.csv
```

## Performance Optimizations

1. **eTag-based conditional requests** - Only downloads CSV when data changes (304 Not Modified responses)
2. **Batch database inserts** - 500 records per batch for efficient upserts
3. **Database indexing** - Primary key on `eicCode` for fast lookups
4. **Case-insensitive search** - PostgreSQL `ILIKE` for flexible name matching
5. **Result limiting** - Search returns max 100 results

## Recent Changes

- **Nov 12, 2025** - Added interactive HTML documentation at root path
  - Dynamic base URL generation for deployment compatibility
  - Professional styling with syntax-highlighted examples
  - Complete endpoint reference with request/response samples
- Initial implementation (Nov 12, 2025)
  - Database schema with eic_codes and refresh_metadata tables
  - CSV refresh service with eTag optimization
  - API endpoints for code lookup, name search, and status
  - Automated 15-minute refresh schedule
  - Manual refresh endpoint

## Future Enhancements

1. Add database indexing on name fields for faster searches
2. Implement full-text search capabilities
3. Add filtering by country, status, or function type
4. Create API rate limiting
5. Add comprehensive test coverage
6. Monitor refresh job execution and alerting
