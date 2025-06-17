# Player Flow Backend Implementation

This document outlines the completed backend implementation of the player flow as specified in the project requirements.

## Overview

The player flow has been fully implemented with proper authorization, payment integration, and real-time visibility features. The implementation follows Laravel best practices with service classes, policies, and form request validation.

## Implemented Features

### 1. Core Player Flow

#### **Sees Active/Scheduled Match Sessions**
- **Endpoint**: `GET /api/players/{player}/match-sessions`
- **Functionality**: Players can view all active and scheduled match sessions in their turf
- **Authorization**: Player must belong to the turf
- **Returns**: Match sessions with team information and player counts

#### **Joins Team Slot & Pays Online**
- **Endpoint**: `POST /api/players/{player}/join-team`
- **Functionality**: Players can join available team slots and initialize payment
- **Request Body**:
  ```json
  {
    "match_session_id": "required|exists:match_sessions,id",
    "team_id": "nullable|exists:teams,id", // Optional - system will create/assign if null
    "payment_amount": "required|numeric|min:0"
  }
  ```
- **Process**:
  1. Validates player eligibility
  2. Checks team availability
  3. Creates/assigns team if needed
  4. Initializes Paystack payment
  5. Adds player to team upon successful payment initialization
  6. Sets captain if first player in team

#### **Tracks Team Status Based on Results**
- **Endpoint**: `GET /api/players/{player}/team-status`
- **Functionality**: Players can see their current team status across all active match sessions
- **Returns**: Team wins/losses/draws, current status, recent matches

### 2. Supporting Features

#### **View Available Teams**
- **Endpoint**: `GET /api/players/{player}/match-sessions/{matchSession}/teams`
- **Functionality**: Shows teams with available slots for a specific match session
- **Filters**: Only shows teams with less than 6 players

#### **Leave Team**
- **Endpoint**: `POST /api/players/{player}/leave-team`
- **Functionality**: Players can leave teams before match starts
- **Request Body**:
  ```json
  {
    "team_id": "required|exists:teams,id"
  }
  ```
- **Restrictions**: Only allowed for scheduled match sessions

#### **Payment History**
- **Endpoint**: `GET /api/players/{player}/payment-history`
- **Functionality**: View payment history for turf-related activities
- **Parameters**: Supports pagination with `per_page`

#### **Pre-join Validation**
- **Endpoint**: `POST /api/players/{player}/can-join-team`
- **Functionality**: Check if player can join a team before payment
- **Returns**: Boolean status with reason and available slots

## Authorization & Policies

### PlayerPolicy
- **viewAny**: Any authenticated user can view players in their turfs
- **view**: Users can view players in same turf or their own record
- **create**: Any authenticated user can join a turf as player
- **update**: Users can update own record; admins/managers can update players in their turf
- **delete**: Users can leave turf; admins/managers can remove players
- **joinTeam**: Users can join teams if they are active players
- **viewMatchSessions**: Users can view sessions if they belong to same turf
- **makePayment**: Users can make payments only for their own player record

### TeamPolicy
- **viewAny/view**: Users can view teams in their turfs
- **create**: Managers and admins can create teams
- **update**: Team captains and turf managers/admins can update teams
- **delete**: Only turf managers/admins can delete teams
- **join**: Active players can join teams in scheduled/active sessions
- **leave**: Team members can leave before match starts
- **invitePlayers**: Team captains and turf managers can invite players

## Business Logic

### Team Management
- **Auto Team Creation**: If no team specified, system creates new team or assigns to available team
- **Captain Assignment**: First player to join team becomes captain
- **Team Limits**: Maximum 6 players per team, configurable max teams per session
- **Captain Reassignment**: When captain leaves, next player becomes captain

### Payment Integration
- **Paystack Integration**: Uses existing PaymentService for payment initialization
- **Payment Types**: Supports session fees and team joining fees
- **Payment Tracking**: Links payments to specific match sessions and teams

### Queue Logic Integration
- **Team Status Tracking**: Integrates with existing queue logic for win/loss/draw outcomes
- **Status Updates**: Teams automatically update status based on match results
- **Real-time Visibility**: Players can see current team status and match history

## Error Handling

The implementation includes comprehensive error handling:

- **Validation Errors**: Form request validation with custom messages
- **Business Logic Errors**: InvalidArgumentException for business rule violations
- **Authorization Errors**: Policy-based authorization with descriptive messages
- **Payment Errors**: Integration with PaymentService error handling

## Database Integration

### Models Used
- **Player**: Core player entity with turf association
- **MatchSession**: Session management with team limits
- **Team**: Team entity with captain and statistics
- **TeamPlayer**: Pivot table for team membership
- **Payment**: Payment tracking with polymorphic relationships

### Relationships
- Players belong to turfs and users
- Teams belong to match sessions
- TeamPlayers link players to teams
- Payments use polymorphic relationships for flexibility

## API Response Format

All endpoints follow consistent JSON response format:

```json
{
  "data": {}, // Resource data or collection
  "message": "Success message",
  "meta": {} // Pagination metadata when applicable
}
```

Error responses:
```json
{
  "error": "Error message",
  "errors": {} // Validation errors when applicable
}
```

## Usage Example

```javascript
// 1. Player views available match sessions
GET /api/players/1/match-sessions

// 2. Player checks available teams for a session
GET /api/players/1/match-sessions/5/teams

// 3. Player validates they can join before payment
POST /api/players/1/can-join-team
{
  "match_session_id": 5,
  "team_id": 3
}

// 4. Player joins team and pays
POST /api/players/1/join-team
{
  "match_session_id": 5,
  "team_id": 3,
  "payment_amount": 50.00
}

// 5. Player checks their current status
GET /api/players/1/team-status
```

## Integration Points

The player flow integrates seamlessly with:
- **Existing Payment System**: Uses PaymentService for Paystack integration
- **Permission System**: Leverages Laravel Permission package with turf-based permissions
- **Match Management**: Works with existing MatchSessionService
- **Queue Logic**: Integrates with QueueLogic for team rotation

This implementation provides a complete, production-ready player flow that mirrors the real-life turf experience as specified in the project requirements.
