# TurfMate API Documentation

## Overview
This document provides an overview of the RESTful CRUD API controllers created for the TurfMate application.

## Authentication

### Authentication Endpoints (`/api/auth`)

The authentication system provides comprehensive user management with Laravel Sanctum token-based authentication.

#### Public Endpoints (No Authentication Required)

**Registration**
- `POST /api/auth/register` - Register new user account
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "password123",
    "password_confirmation": "password123"
  }
  ```
  **Response:** User data + Bearer token

**Login**
- `POST /api/auth/login` - Authenticate user credentials
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  **Response:** User data + Bearer token

**Password Reset Flow**
- `POST /api/auth/forgot-password` - Send password reset email
  ```json
  {
    "email": "john@example.com"
  }
  ```

- `POST /api/auth/reset-password` - Reset password with token
  ```json
  {
    "token": "reset_token_from_email",
    "email": "john@example.com",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
  }
  ```

**Email Verification**
- `GET /api/auth/verify-email/{id}/{hash}` - Verify email address
  - Requires signed URL from verification email
  - Query params: `expires`, `signature` (from email link)

#### Protected Endpoints (Requires Bearer Token)

**User Management**
- `GET /api/auth/user` - Get authenticated user profile
- `POST /api/auth/logout` - Logout (revoke current token)
- `POST /api/auth/logout-all` - Logout from all devices (revoke all tokens)

**Email Verification**
- `POST /api/auth/email/verification-notification` - Send verification email
  - Rate limited: 6 attempts per minute

**Password Confirmation**
- `POST /api/auth/confirm-password` - Confirm user password for sensitive operations
  ```json
  {
    "password": "current_password"
  }
  ```

#### Authentication Headers
All protected endpoints require the Bearer token in the Authorization header:
```
Authorization: Bearer your_token_here
Accept: application/json
Content-Type: application/json
```

#### Response Format
All authentication endpoints return consistent JSON responses:

**Success Response:**
```json
{
  "message": "Operation successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": "2025-06-18T10:00:00.000000Z",
    "created_at": "2025-06-18T09:00:00.000000Z",
    "updated_at": "2025-06-18T10:00:00.000000Z"
  },
  "token": "bearer_token_here"
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

#### Security Features
- Rate limiting on login attempts and email verification
- CSRF protection for web forms
- Signed URLs for email verification
- Password confirmation for sensitive operations
- Token-based API authentication with Sanctum
- Email verification requirement (configurable)

---

## Controllers & Resources

### 1. UserController (`/api/users`)
**Resource:** `UserResource`
**Form Requests:** `StoreUserRequest`, `UpdateUserRequest`

**Features:**
- Filter by role (`?role=admin|manager|player`)
- Search by name or email (`?search=john`)
- Include relationships (`?include=ownedTurfs,players`)
- Pagination support (`?per_page=20`)

**Endpoints:**
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/{user}` - Get specific user
- `PUT/PATCH /api/users/{user}` - Update user
- `DELETE /api/users/{user}` - Delete user

---

### 2. TurfController (`/api/turfs`)
**Resource:** `TurfResource`
**Form Requests:** `StoreTurfRequest`, `UpdateTurfRequest`

**Features:**
- Filter by owner (`?owner_id=1`)
- Filter by active status (`?is_active=true`)
- Filter by membership requirement (`?requires_membership=true`)
- Search by name or location (`?search=stadium`)
- Include relationships (`?include=owner,players,matchSessions`)

**Endpoints:**
- `GET /api/turfs` - List all turfs
- `POST /api/turfs` - Create new turf
- `GET /api/turfs/{turf}` - Get specific turf
- `PUT/PATCH /api/turfs/{turf}` - Update turf
- `DELETE /api/turfs/{turf}` - Delete turf

---

### 3. PlayerController (`/api/players`)
**Resource:** `PlayerResource`
**Form Requests:** `StorePlayerRequest`, `UpdatePlayerRequest`

**Features:**
- Filter by user (`?user_id=1`)
- Filter by turf (`?turf_id=1`)
- Filter by membership status (`?is_member=true`)
- Filter by status (`?status=active`)
- Include relationships (`?include=user,turf,teamPlayers,matchEvents`)

---

### 4. TeamController (`/api/teams`)
**Resource:** `TeamResource`
**Form Requests:** `StoreTeamRequest`, `UpdateTeamRequest`

**Features:**
- Filter by match session (`?match_session_id=1`)
- Filter by captain (`?captain_id=1`)
- Filter by status (`?status=active_in_match`)
- Search by name (`?search=team`)
- Include relationships (`?include=matchSession,captain,teamPlayers`)

---

### 5. MatchSessionController (`/api/match-sessions`)
**Resource:** `MatchSessionResource`
**Form Requests:** `StoreMatchSessionRequest`, `UpdateMatchSessionRequest`

**Features:**
- Filter by turf (`?turf_id=1`)
- Filter by status (`?status=active`)
- Filter by active sessions (`?is_active=true`)
- Filter by time slot (`?time_slot=morning|evening`)
- Filter by date range (`?date_from=2025-01-01&date_to=2025-01-31`)
- Search by name (`?search=weekend`)
- Include relationships (`?include=turf,teams,gameMatches,queueLogic`)

---

### 6. GameMatchController (`/api/game-matches`)
**Resource:** `GameMatchResource`
**Form Requests:** `StoreGameMatchRequest`, `UpdateGameMatchRequest`

**Features:**
- Filter by match session (`?match_session_id=1`)
- Filter by team (`?team_id=1`)
- Filter by status (`?status=completed`)
- Filter by outcome (`?outcome=win|loss|draw`)
- Filter by date range (`?date_from=2025-01-01&date_to=2025-01-31`)
- Include relationships (`?include=matchSession,firstTeam,secondTeam,winningTeam,matchEvents`)

---

### 7. MatchEventController (`/api/match-events`)
**Resource:** `MatchEventResource`
**Form Requests:** `StoreMatchEventRequest`, `UpdateMatchEventRequest`

**Features:**
- Filter by game match (`?game_match_id=1`)
- Filter by player (`?player_id=1`)
- Filter by team (`?team_id=1`)
- Filter by event type (`?type=goal|yellow_card|red_card|substitution_in|substitution_out`)
- Filter by minute range (`?minute_from=0&minute_to=45`)
- Include relationships (`?include=gameMatch,player,team,relatedPlayer`)

---

### 8. QueueLogicController (`/api/queue-logic`)
**Resource:** `QueueLogicResource`
**Form Requests:** `StoreQueueLogicRequest`, `UpdateQueueLogicRequest`

**Features:**
- Filter by match session (`?match_session_id=1`)
- Filter by team (`?team_id=1`)
- Filter by status (`?status=waiting`)
- Include relationships (`?include=matchSession,team`)

---

### 9. TeamPlayerController (`/api/team-players`)
**Resource:** `TeamPlayerResource`
**Form Requests:** `StoreTeamPlayerRequest`, `UpdateTeamPlayerRequest`

**Features:**
- Filter by team (`?team_id=1`)
- Filter by player (`?player_id=1`)
- Filter by status (`?status=active`)
- Include relationships (`?include=team,player`)

## Nested Routes

For better organization, the following nested routes are available:

### Turf-related routes:
- `GET /api/turfs/{turf}/players` - Get players for a specific turf
- `GET /api/turfs/{turf}/match-sessions` - Get match sessions for a specific turf

### Match Session-related routes:
- `GET /api/match-sessions/{matchSession}/teams` - Get teams for a specific match session
- `GET /api/match-sessions/{matchSession}/game-matches` - Get game matches for a specific match session
- `GET /api/match-sessions/{matchSession}/queue-logic` - Get queue logic for a specific match session

### Team-related routes:
- `GET /api/teams/{team}/players` - Get players for a specific team
- `GET /api/teams/{team}/game-matches` - Get game matches for a specific team

### Game Match-related routes:
- `GET /api/game-matches/{gameMatch}/events` - Get events for a specific game match

### User-related routes:
- `GET /api/users/{user}/turfs` - Get turfs owned by a specific user
- `GET /api/users/{user}/players` - Get player records for a specific user

## Common Features

All controllers include:
- **Pagination**: Use `?per_page=X` parameter
- **Relationship Loading**: Use `?include=relation1,relation2` parameter
- **Consistent Error Handling**: Returns appropriate HTTP status codes
- **Form Request Validation**: Comprehensive validation rules
- **Resource Transformations**: Consistent API responses
- **Type Hinting**: All methods have proper type hints and return types

## Authentication

The API includes the standard Laravel Sanctum authentication endpoint:
- `GET /api/user` - Get authenticated user (requires `auth:sanctum` middleware)

## Response Format

All API responses follow Laravel's API Resource format:
```json
{
  "data": [...],
  "links": {...},
  "meta": {...}
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (for deletions)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error
