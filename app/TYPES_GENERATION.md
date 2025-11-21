# TypeScript Types Generation

This project uses automatic TypeScript type generation from the FastAPI backend's OpenAPI specification.

## How It Works

1. **Backend OpenAPI Export**: The `export_openapi.py` script extracts the OpenAPI schema from the FastAPI application
2. **Type Generation**: The `openapi-typescript` package converts the OpenAPI schema into TypeScript types
3. **Automation**: The process is automated via npm scripts

## Generated Files

- `src/types/api.ts` - Auto-generated TypeScript types from the backend API
- `../backend/openapi.json` - OpenAPI specification (auto-generated)

**Warning**: Do not manually edit `src/types/api.ts` as it will be overwritten on the next generation.

## Usage

### Generate Types

Run this command whenever the backend API changes:

```bash
npm run types
```

Or use the longer form:

```bash
npm run generate-types
```

### Using Generated Types

The generated types are organized by API paths and operations. Here's how to use them:

```typescript
import type { paths, components } from './types/api';

// Get the response type for a specific endpoint
type BookingsResponse = paths['/bookings/my-bookings']['get']['responses']['200']['content']['application/json'];

// Get schema types
type Booking = components['schemas']['Booking'];
type UserOut = components['schemas']['UserOut'];

// Get request body types
type BookingCreate = paths['/bookings/']['post']['requestBody']['content']['application/json'];
```

### Example: Type-Safe API Service

```typescript
import type { components } from './types/api';
import api from './api';

type Booking = components['schemas']['Booking'];
type BookingCreate = components['schemas']['BookingCreate'];

class BookingsService {
  async createBooking(data: BookingCreate): Promise<Booking> {
    const response = await api.post<Booking>('/bookings/', data);
    return response.data;
  }

  async getMyBookings(): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/bookings/my-bookings');
    return response.data;
  }
}
```

## When to Regenerate Types

Regenerate types whenever:
- New API endpoints are added
- Existing endpoints are modified
- Request/response schemas change
- After pulling backend changes from git

## Troubleshooting

### Types Not Updating

If types don't reflect recent backend changes:

1. Ensure the backend changes are saved
2. Run `npm run types` again
3. Restart your TypeScript server in your IDE

### Generation Fails

If type generation fails:

1. Check that the backend virtual environment is activated
2. Ensure all backend dependencies are installed
3. Verify the backend application starts without errors

## Scripts Location

- Backend export script: `../backend/export_openapi.py`
- Frontend generation script: `./scripts/generate-types.sh`
