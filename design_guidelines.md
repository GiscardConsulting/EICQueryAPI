# Design Guidelines - EIC Code API Service

## Project Classification

This is a **backend API service** without a frontend user interface. The project consists of:
- REST API endpoints for querying EIC codes
- PostgreSQL database storage
- Automated data refresh mechanism
- JSON response format

## No Visual Design Required

Based on the requirements, this project does not include a web interface or visual components. It's a pure API service that will be consumed programmatically by other applications or services.

**Current Scope:**
- API endpoints returning JSON data
- Database operations
- Background job scheduling
- No HTML, CSS, or visual interface

## Optional Future Frontend Addition

If you later decide to add a web interface for this API, consider these minimal additions:

**Admin Dashboard (Optional):**
- Simple status page showing:
  - Last refresh timestamp
  - Total EIC codes in database
  - Current eTag value
  - Refresh schedule status
- Search interface for testing API queries
- Minimalist table displaying results

**API Documentation Page (Optional):**
- Clean, minimal documentation
- Example requests and responses
- Endpoint descriptions

## API Response Design

Since this is an API project, the "design" focuses on data structure:

**Response Format:**
```
{
  "data": [...matched records],
  "metadata": {
    "lastRefresh": "ISO timestamp",
    "totalMatches": number,
    "query": "search term"
  }
}
```

**If you want to add a frontend later, please request it separately and I'll provide comprehensive visual design guidelines.**