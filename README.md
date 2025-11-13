# EIC Code API Service

A minimalist REST API for querying ENTSOE European Energy Identification Codes (EIC) with automated synchronization and persistent storage.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔍 **Fast EIC Code Queries** - Query by exact code or search by name
- 🔄 **Automated Refresh** - CSV data updates every 15 minutes with eTag optimization
- 💾 **PostgreSQL Storage** - Persistent database with 14,481+ EIC codes
- 📚 **Interactive Documentation** - Built-in HTML API documentation at root path
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- ⚡ **Performance Optimized** - Batch inserts, conditional requests, indexed lookups

## Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **PostgreSQL** 14 or higher (or use Docker)
- **npm** or **yarn**

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eic-code-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/eicdb
   SESSION_SECRET=your-secure-random-string
   PORT=5000
   NODE_ENV=development
   ```

4. **Create and configure the database**
   ```bash
   # Connect to PostgreSQL and create database
   createdb eicdb
   
   # Push database schema using Drizzle
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the API**
   - API Documentation: http://localhost:5000
   - Health Check: http://localhost:5000/api/status

### Option 2: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eic-code-api
   ```

2. **Configure environment (optional)**
   
   Edit `docker-compose.yml` to customize:
   - Database credentials (POSTGRES_USER, POSTGRES_PASSWORD)
   - SESSION_SECRET (change to a secure random string)
   - Ports (if 5000 is already in use)

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database schema**
   ```bash
   # Wait for containers to be healthy (~10 seconds)
   docker-compose ps
   
   # Push database schema
   docker-compose exec app npm run db:push
   ```

5. **Access the API**
   - API Documentation: http://localhost:5000
   - Health Check: http://localhost:5000/api/status

6. **View logs**
   ```bash
   docker-compose logs -f app
   ```

## Database Setup

### Database Schema

The application uses two main tables:

**eic_codes** - Stores all EIC code data:
```sql
CREATE TABLE eic_codes (
  "eicCode" VARCHAR PRIMARY KEY,
  "eicDisplayName" VARCHAR,
  "eicLongName" VARCHAR,
  "eicParent" VARCHAR,
  "eicResponsibleParty" VARCHAR,
  "eicStatus" VARCHAR,
  "marketParticipantStreetAddress" VARCHAR,
  "marketParticipantPostalCode" VARCHAR,
  "marketParticipantIsoCountryCode" VARCHAR,
  "marketParticipantVatCode" VARCHAR,
  "eicTypeFunctionList" VARCHAR,
  "type" VARCHAR
);
```

**refresh_metadata** - Tracks synchronization status:
```sql
CREATE TABLE refresh_metadata (
  "id" SERIAL PRIMARY KEY,
  "etag" VARCHAR,
  "lastRefresh" TIMESTAMP,
  "totalRecords" INTEGER
);
```

### Schema Management with Drizzle ORM

The schema is defined in `shared/schema.ts` using Drizzle ORM.

**Push schema to database:**
```bash
npm run db:push
```

**For Docker:**
```bash
docker-compose exec app npm run db:push
```

The application will automatically populate the database with EIC codes on first startup.

## API Documentation

### Interactive Documentation

Visit the root URL for complete interactive documentation with examples:
```
http://localhost:5000/
```

### Quick Reference

#### 1. Query by EIC Code
```bash
GET /api/eic/:code
```

**Example:**
```bash
curl http://localhost:5000/api/eic/10X1001A1001A094
```

**Response (Found):**
```json
{
  "data": {
    "eicCode": "10X1001A1001A094",
    "eicDisplayName": "ELIA",
    "eicLongName": "Elia Transmission Belgium",
    "eicStatus": "Active",
    "marketParticipantIsoCountryCode": "BE",
    "type": "X"
  },
  "metadata": {
    "lastRefresh": "2025-11-12T10:15:52.530Z",
    "totalRecords": 14481
  }
}
```

**Response (Not Found):**
```json
{
  "data": null,
  "metadata": {
    "lastRefresh": "2025-11-12T10:15:52.530Z",
    "totalRecords": 14481
  }
}
```

#### 2. Search by Name
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

#### 3. System Status
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

#### 4. Manual Refresh (Optional)
```bash
POST /api/refresh
```

Triggers immediate CSV data refresh.

## Architecture

### Data Synchronization

- **Automated Schedule:** CSV data is refreshed every 15 minutes via cron job
- **eTag Optimization:** Only downloads when source data changes (HTTP 304 responses)
- **Batch Processing:** Inserts 500 records at a time for efficiency
- **Initial Sync:** Runs automatically on server startup

### Technology Stack

- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL 14+ with Drizzle ORM
- **Scheduler:** node-cron
- **CSV Parsing:** csv-parser
- **Validation:** Zod

### Project Structure

```
.
├── server/
│   ├── index.ts              # Application entry point
│   ├── routes.ts             # API endpoints + documentation
│   ├── storage.ts            # Database operations
│   ├── db.ts                 # Database connection
│   ├── eicRefreshService.ts  # CSV sync service
│   └── cronJobs.ts           # Scheduled tasks
├── shared/
│   └── schema.ts             # Database schema (Drizzle)
├── Dockerfile                # Docker build configuration
├── docker-compose.yml        # Docker services orchestration
└── package.json              # Dependencies and scripts
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `SESSION_SECRET` | Session encryption key | Required |
| `PGHOST` | PostgreSQL host | localhost |
| `PGPORT` | PostgreSQL port | 5432 |
| `PGUSER` | PostgreSQL user | Required |
| `PGPASSWORD` | PostgreSQL password | Required |
| `PGDATABASE` | PostgreSQL database name | Required |

## Docker Details

### Building the Image

```bash
docker build -t eic-api:latest .
```

### Running Containers

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart app
```

### Persistent Data

Database data is stored in a Docker volume named `postgres_data`. This ensures data persists between container restarts.

**Backup database:**
```bash
docker-compose exec postgres pg_dump -U eicuser eicdb > backup.sql
```

**Restore database:**
```bash
cat backup.sql | docker-compose exec -T postgres psql -U eicuser -d eicdb
```

### Production Deployment

For production deployments:

1. **Change default credentials** in `docker-compose.yml`
2. **Set secure SESSION_SECRET**
3. **Use environment files** instead of hardcoding values
4. **Set up SSL/TLS** with a reverse proxy (nginx, Traefik)
5. **Configure backups** for PostgreSQL volume
6. **Monitor logs** and set up alerts

## Data Source

CSV data is fetched from ENTSOE:
```
https://eepublicdownloads.blob.core.windows.net/cio-lio/csv/X_eicCodes.csv
```

## Performance

- **Response Time:** < 50ms for exact code lookups
- **Search Results:** Max 100 results per query
- **Batch Upserts:** 500 records per batch
- **Database:** Indexed on `eicCode` (primary key)
- **Conditional Requests:** eTag-based, avoids unnecessary downloads

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Verify connection from app
docker-compose exec app npm run db:push
```

### Schema Not Created

```bash
# Push schema manually
npm run db:push

# Or with Docker
docker-compose exec app npm run db:push
```

### Data Not Refreshing

```bash
# Check cron job logs
docker-compose logs app | grep Cron

# Trigger manual refresh
curl -X POST http://localhost:5000/api/refresh
```

### Port Already in Use

Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "8080:5000"  # Use port 8080 instead
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
