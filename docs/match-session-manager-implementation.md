# Match Session Manager Flow - Backend Implementation

## Overview

This document outlines the implemented backend functionality for the Match Session Manager Flow according to the project specifications. The implementation includes comprehensive role-based access control, automatic team creation, player management, and queue logic processing.

## Key Features Implemented

### 1. Role-Based Access Control

- **MatchSessionPolicy**: Comprehensive policy that gates access based on user roles (admin, manager, player)
- **Permissions**: Only users with admin or manager roles in a turf can manage match sessions
- **Authorization**: All endpoints are protected with appropriate policy checks

### 2. Match Session Management

#### Creating Match Sessions with Teams
- **Endpoint**: `POST /api/match-sessions`
- **Functionality**: Automatically creates teams based on `max_teams` parameter (4-8 teams)
- **Queue Initialization**: Automatically sets up queue logic with first 2 teams ready to play

#### Starting Match Sessions
- **Endpoint**: `POST /api/match-sessions/{matchSession}/start`
- **Functionality**: 
  - Sets session status to 'active'
  - Creates the first game match if enough teams are available
  - Updates team statuses in queue

#### Stopping Match Sessions
- **Endpoint**: `POST /api/match-sessions/{matchSession}/stop`
- **Functionality**: Sets session status to 'completed' and stops queue processing

### 3. Player Management

#### Adding Players to Teams
- **Endpoint**: `POST /api/match-sessions/{matchSession}/add-player-to-team`
- **Parameters**: 
  - `team_id`: ID of the team to add player to
  - `player_id`: ID of the player to add
- **Validations**:
  - Player must belong to the same turf
  - Team cannot exceed 6 players
  - Player cannot be in multiple teams for the same session
  - Automatically sets captain if team doesn't have one

### 4. Queue Logic Processing

#### Automatic Match Rotation
The system follows the real-life match rotation rules:

- **Win**: Winning team stays, losing team goes to end of queue
- **Loss**: Losing team moves to end of queue, next team steps in
- **Draw**: Both teams step out, random team re-enters first next round

#### Setting Game Results
- **Endpoint**: `POST /api/match-sessions/{matchSession}/set-game-result`
- **Parameters**:
  - `game_match_id`: ID of the completed game match
  - `first_team_score`: Score of the first team
  - `second_team_score`: Score of the second team
- **Automatic Processing**:
  - Updates team statistics (wins, losses, draws)
  - Processes queue logic based on result
  - Creates next game match if session is still active

### 5. Queue Status Monitoring

#### Get Queue Status
- **Endpoint**: `GET /api/match-sessions/{matchSession}/queue-status`
- **Response**: Returns current queue status with team positions, statuses, and reasons

## Technical Implementation

### Services Architecture

1. **MatchSessionService**: Main service for match session operations
2. **QueueLogicService**: Dedicated service for queue management
3. **TeamService**: Service for team operations (existing)
4. **GameMatchService**: Service for game match operations (existing)

### Models Enhanced

1. **MatchSession**: Enhanced with comprehensive relationships
2. **Team**: Enhanced with queue logic integration
3. **QueueLogic**: Core model for managing team queue positions
4. **GameMatch**: Enhanced with outcome processing
5. **Player**: Enhanced with role-based access methods

### Request Classes

1. **StoreMatchSessionRequest**: Validation for creating match sessions
2. **AddPlayerToTeamRequest**: Validation for adding players to teams
3. **SetGameResultRequest**: Validation for setting game results

### Policies

1. **MatchSessionPolicy**: Comprehensive authorization policy with methods:
   - `create`: Check if user can create match sessions
   - `start`: Check if user can start sessions
   - `stop`: Check if user can stop sessions
   - `addPlayersToTeam`: Check if user can manage team players
   - `setMatchResult`: Check if user can set match results

## API Endpoints Summary

### Public Endpoints (with authentication)
- `GET /api/match-sessions` - List match sessions
- `GET /api/match-sessions/{matchSession}` - Get match session details
- `GET /api/match-sessions/{matchSession}/queue-status` - Get queue status

### Manager/Admin Only Endpoints
- `POST /api/match-sessions` - Create match session with teams
- `POST /api/match-sessions/{matchSession}/start` - Start match session
- `POST /api/match-sessions/{matchSession}/stop` - Stop match session
- `POST /api/match-sessions/{matchSession}/add-player-to-team` - Add player to team
- `POST /api/match-sessions/{matchSession}/set-game-result` - Set game result
- `PUT /api/match-sessions/{matchSession}` - Update match session
- `DELETE /api/match-sessions/{matchSession}` - Delete match session

## Queue Logic Flow

1. **Session Creation**: Teams are created and added to queue with positions
2. **Session Start**: First two teams are marked as 'next_to_play'
3. **Match Creation**: Game match is created between the first two teams
4. **Result Processing**: Based on match outcome:
   - **Win**: Winner stays, loser goes to back of queue
   - **Draw**: Both teams wait, random selection for next round
5. **Next Match**: System automatically creates next match if session is active

## Error Handling

- **Invalid Arguments**: Proper exception handling for business rule violations
- **Authorization**: Policy-based access control with meaningful error messages
- **Validation**: Comprehensive request validation with custom error messages
- **Database Integrity**: Proper foreign key relationships and constraints

## Testing

The implementation can be tested using:
- Unit tests for service methods
- Feature tests for API endpoints
- Policy tests for authorization rules
- Integration tests for queue logic flow

## Usage Examples

### Creating a Match Session
```bash
POST /api/match-sessions
{
    "turf_id": 1,
    "name": "Weekend Morning Match",
    "session_date": "2025-06-15",
    "time_slot": "morning",
    "start_time": "09:00",
    "end_time": "12:00",
    "max_teams": 6,
    "status": "scheduled"
}
```

### Adding Player to Team
```bash
POST /api/match-sessions/1/add-player-to-team
{
    "team_id": 1,
    "player_id": 5
}
```

### Setting Game Result
```bash
POST /api/match-sessions/1/set-game-result
{
    "game_match_id": 1,
    "first_team_score": 3,
    "second_team_score": 1
}
```

This implementation provides a solid foundation for the turf manager flow, ensuring proper access control, automatic team management, and seamless queue logic processing that mirrors real-life match rotation rules.
