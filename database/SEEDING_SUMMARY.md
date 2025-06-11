# TurfHub Database Seeding Summary

## 🎯 Overview
The database has been seeded with realistic, production-like data that simulates a real-world turf booking and match management system.

## 📊 Data Generated

### Users (34 total)
- **1 Admin User**: admin@turfhub.com / password
- **1 Test Player**: test@example.com / password  
- **20 Regular Players**: Randomly generated player accounts
- **8 Managers**: Turf owners and operators
- **3 Additional Admins**: System administrators

### Turfs (18 total)
- **5 Manager-owned turfs**: Each manager owns 1-3 turfs
- **8 Additional turfs**: With random owners
- **3 Premium turfs**: With membership requirements
- **2 Inactive turfs**: Currently not operational

### Match Sessions (~90 total)
- **Past completed sessions**: 5-15 per turf
- **Active sessions**: 1-2 per turf (70% chance)
- **Future scheduled sessions**: 2-8 per turf
- **Time slots**: Mix of morning (6:00-14:00) and evening (18:00-22:00)

### Players (~150 total)
- Each player registered at 1-3 turfs
- **70% are members** of turfs requiring membership
- **30% are members** of free turfs
- **90% active status**, 10% inactive/banned
- Realistic distribution across all turfs

### Teams (~350 total)
- **4-8 teams per match session** (as per specifications)
- Team names: Fire Dragons, Thunder Bolts, Lightning Strikers, etc.
- **Performance stats**: Wins, losses, draws
- **Status**: active_in_match, waiting, eliminated
- **Special categories**: Top performers and underperformers

### Team Players (~1,200+ associations)
- **3 to max_players_per_team** players per team
- **Status distribution**: 75% active, 20% benched, 5% substituted out
- **Join times**: Realistic timestamps within match sessions
- No duplicate player assignments per team

### Game Matches (~200 total)
- **Completed matches**: Full scorelines and outcomes
- **In-progress matches**: Current active games
- **Upcoming matches**: Scheduled future games
- **Score variations**: Low-scoring (0-2) to high-scoring (5-12)
- **Realistic outcomes**: Wins, losses, draws with proper team stat updates

### Match Events (~800+ total)
- **Goals**: Based on actual match scores
- **Yellow cards**: Common disciplinary actions
- **Red cards**: Rare but realistic (15% chance per match)
- **Substitutions**: Player changes during matches
- **Realistic timing**: Events distributed across match minutes
- **Contextual comments**: Detailed descriptions for each event type

### Queue Logic (~150 entries)
- **Active session queues**: Teams waiting to play
- **Queue positions**: 1-8 based on match session capacity
- **Status tracking**: waiting, next_to_play, played_waiting_draw_resolution
- **Realistic reasons**: initial_join, win, loss, draw scenarios
- **Proper queue management** for tournament-style play

## 🎮 Realistic Scenarios Created

### Active Match Sessions
- Teams currently playing matches
- Live scoreboards with real-time events
- Queue systems with teams waiting their turn
- Mix of member and non-member players

### Historical Data
- Completed tournaments with full match results
- Player statistics and team performance records
- Event histories showing goals, cards, and substitutions
- Seasonal patterns across different time slots

### Future Planning
- Scheduled upcoming matches
- Team formations ready for play
- Queue positions established for tournaments
- Capacity management based on turf limits

## 🔑 Login Credentials

### Admin Access
- **Email**: admin@turfhub.com
- **Password**: password
- **Role**: admin

### Test Player
- **Email**: test@example.com  
- **Password**: password
- **Role**: player

### All Other Users
- **Password**: password (universal for testing)
- **Roles**: Distributed as player (65%), manager (25%), admin (10%)

## 📈 Data Relationships

The seeded data maintains proper referential integrity:
- Players belong to specific turfs and users
- Teams exist within match sessions
- Matches occur between valid teams
- Events are tied to actual matches and players
- Queue logic reflects current session states

## 🚀 Ready for Development

The database now contains:
- **Realistic data volumes** for performance testing
- **Edge cases** (draws, red cards, substitutions)
- **Active scenarios** for real-time features
- **Historical data** for analytics and reporting
- **User variety** for role-based testing

Perfect for developing and testing all TurfHub features including:
- Match management and live scoring
- Tournament queue systems
- Player statistics and leaderboards
- Turf booking and membership management
- Real-time notifications and updates

---

*Generated on June 11, 2025 - Ready for development! 🏆*
