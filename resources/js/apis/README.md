# TurfHub API Client

This directory contains the API client configuration and endpoints for the TurfHub application.

## Structure

```
apis/
├── index.ts          # Main axios configuration and base API functions
├── auth.ts           # Authentication endpoints
├── turf.ts           # Turf management endpoints
├── player.ts         # Player management endpoints
├── team.ts           # Team management endpoints
├── matchSession.ts   # Match session endpoints
├── payment.ts        # Payment processing endpoints
├── examples.ts       # Usage examples
└── README.md         # This file
```

## Configuration

The API client is configured with:

- **Base URL**: `/api` (configurable via `VITE_API_URL`)
- **Timeout**: 30 seconds
- **With Credentials**: `true` (includes cookies and auth headers)
- **CSRF Protection**: Automatically includes CSRF token from meta tag
- **Authentication**: Supports Bearer token from localStorage

## Usage

### Basic Import

```typescript
import { api, authApi, turfApi, playerApi } from '@/apis';
```

### Authentication

```typescript
// Login
const response = await authApi.login({ email, password });

// Get current user
const user = await authApi.getUser();

// Logout
await authApi.logout();
```

### Turf Management

```typescript
// Get all turfs
const turfs = await turfApi.getAll({ is_active: true });

// Get turf by ID
const turf = await turfApi.getById(1);

// Create turf
const newTurf = await turfApi.create(turfData);
```

### Player Operations

```typescript
// Get players with filters
const players = await playerApi.getAll({
  skill_level: 'intermediate',
  is_active: true,
});

// Update profile
await playerApi.updateMe({ bio: 'New bio' });
```

### Error Handling

All API functions throw errors that can be caught:

```typescript
try {
  const result = await authApi.login(credentials);
  // Handle success
} catch (error) {
  // Handle error
  console.error('Login failed:', error);
}
```

### TypeScript Support

Full TypeScript support with interfaces for all data types:

```typescript
import type { User, Turf, Player, MatchSession, ApiResponse } from '@/apis';
```

### Environment Variables

Set these in your `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

## Features

- **Automatic CSRF Protection**: Includes Laravel CSRF tokens
- **Authentication Management**: Token storage and refresh
- **Request/Response Interceptors**: For common error handling
- **Type Safety**: Full TypeScript support
- **Configurable**: Environment-based configuration
- **Error Handling**: Consistent error responses
- **Pagination Support**: Built-in pagination handling

## API Endpoints

### Authentication (`/auth`)

- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - User logout
- `GET /user` - Get current user
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### Turfs (`/turfs`)

- `GET /turfs` - List turfs (with filters)
- `GET /turfs/{id}` - Get turf details
- `POST /turfs` - Create turf
- `PUT /turfs/{id}` - Update turf
- `DELETE /turfs/{id}` - Delete turf

### Players (`/players`)

- `GET /players` - List players
- `GET /players/me` - Get current player
- `PUT /players/me` - Update profile
- `POST /players/me/avatar` - Upload avatar

### Teams (`/teams`)

- `GET /teams` - List teams
- `POST /teams` - Create team
- `GET /teams/{id}/players` - Get team players
- `POST /teams/{id}/players` - Add player to team

### Match Sessions (`/match-sessions`)

- `GET /match-sessions` - List sessions
- `POST /match-sessions` - Create session
- `POST /match-sessions/{id}/join` - Join session
- `POST /match-sessions/{id}/start` - Start session

### Payments (`/payments`)

- `POST /payments/initialize` - Initialize payment
- `POST /payments/verify` - Verify payment
- `GET /payments/history` - Payment history

## Examples

See `examples.ts` for detailed usage examples and patterns.
