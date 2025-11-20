# Tournament System Admin Guide

## Overview

The TurfMate tournament system enables turf owners and administrators to create and manage complex multi-stage tournaments or simple single-session competitions. This guide covers everything you need to know to set up and run successful tournaments.

## Table of Contents

- [Quick Start](#quick-start)
- [Tournament Types](#tournament-types)
- [Stage Types](#stage-types)
- [Creating Tournaments](#creating-tournaments)
- [Promotion Rules](#promotion-rules)
- [Common Tournament Structures](#common-tournament-structures)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Creating Your First Tournament

1. **Create the Tournament**
   ```bash
   POST /api/tournaments
   {
     "name": "Summer Championship",
     "type": "multi_stage_tournament",
     "turf_id": 1,
     "start_date": "2025-07-01",
     "max_teams": 16
   }
   ```

2. **Add a Stage**
   ```bash
   POST /api/tournaments/{tournament_id}/stages
   {
     "name": "Group Stage",
     "stage_type": "group",
     "config": {
       "number_of_groups": 4,
       "rounds": 1
     }
   }
   ```

3. **Assign Teams**
   ```bash
   POST /api/stages/{stage_id}/assign-teams
   {
     "team_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
   }
   ```

4. **Generate Fixtures**
   ```bash
   POST /api/stages/{stage_id}/generate-fixtures
   ```

## Tournament Types

### Single Session
- **Use Case**: One-off competitions, friendly tournaments
- **Characteristics**: 
  - Single stage only
  - No promotion between stages
  - Quick setup
- **Example**: A weekend knockout cup

### Multi-Stage Tournament
- **Use Case**: Complex competitions with multiple phases
- **Characteristics**:
  - Multiple sequential stages
  - Team promotion between stages
  - Flexible stage types
- **Example**: Champions League (Groups → Knockout)

## Stage Types

### League (Round-Robin)

**When to Use:**
- All teams should play each other
- You want a fair, balanced competition
- You have time for many matches

**Configuration:**
```json
{
  "stage_type": "league",
  "config": {
    "rounds": 2,           // Number of rounds (default: 1)
    "home_and_away": true  // Generate return fixtures (default: true)
  }
}
```

**How It Works:**
- Generates fixtures where every team plays every other team
- With `rounds: 2`, each team plays every other team twice
- With `home_and_away: true`, teams play both home and away
- Rankings based on points (W=3, D=1, L=0)

**Best For:**
- 4-20 teams
- League competitions
- Fair championship format

**Example:**
- English Premier League
- La Liga
- Any round-robin tournament

---

### Group Stage

**When to Use:**
- Large number of teams (16+)
- Need to reduce teams before knockout
- Want balanced groups with internal competition

**Configuration:**
```json
{
  "stage_type": "group",
  "config": {
    "number_of_groups": 4,  // Number of groups (required)
    "rounds": 1,             // Rounds within each group (default: 1)
    "home_and_away": false   // Home/away fixtures (default: false)
  },
  "promotion_rules": [
    {
      "type": "top_per_group",
      "config": { "n": 2 }  // Top 2 from each group advance
    }
  ]
}
```

**How It Works:**
- Divides teams evenly into groups
- Each group runs a mini round-robin
- Rankings calculated per group
- Top teams from each group promote to next stage

**Best For:**
- 16-32 teams
- World Cup style format
- Champions League style

**Example:**
- FIFA World Cup Group Stage (8 groups of 4)
- UEFA Champions League Groups (8 groups of 4, top 2 advance)

---

### Knockout (Elimination)

**When to Use:**
- Playoff rounds
- Finals and semi-finals
- Quick tournament conclusion

**Configuration:**
```json
{
  "stage_type": "knockout",
  "config": {
    "seeding": true,           // Seed teams by rank (default: true)
    "legs": 2,                 // 1 or 2 legs per tie (default: 1)
    "third_place_match": true  // Generate 3rd place match (default: false)
  }
}
```

**How It Works:**
- Creates single-elimination bracket
- Losers are eliminated immediately
- Winner advances to next round
- Optionally uses 2-leg format (home & away)

**Best For:**
- 4, 8, 16, 32 teams (powers of 2)
- Playoff stages
- Finals

**Requirements:**
- Number of teams should be a power of 2 (4, 8, 16, 32)
- Non-power-of-2 teams will receive byes in first round

**Example:**
- FA Cup Knockout Rounds
- Champions League Knockout Stage (2 legs)
- NBA Playoffs

---

### Swiss System

**When to Use:**
- Large number of teams
- Limited time for matches
- Want competitive matchups without eliminations

**Configuration:**
```json
{
  "stage_type": "swiss",
  "config": {
    "rounds": 5  // Number of Swiss rounds (required)
  },
  "promotion_rules": [
    {
      "type": "top_n",
      "config": { "n": 8 }  // Top 8 overall advance
    }
  ]
}
```

**How It Works:**
- Teams paired based on current standings
- Teams with similar records play each other
- No eliminations - all teams play all rounds
- Final standings determine promotion

**Best For:**
- Chess tournaments
- Large esports tournaments
- 10-100+ teams with limited match time

**Advantages:**
- No early eliminations
- Competitive matchups throughout
- Scalable to many teams

**Example:**
- Chess Swiss Tournaments
- Magic: The Gathering tournaments
- Rocket League Regional qualifiers

## Creating Tournaments

### Step-by-Step: World Cup Style (32 Teams)

#### Stage 1: Group Stage
```json
POST /api/tournaments/{tournament_id}/stages
{
  "name": "Group Stage",
  "stage_type": "group",
  "order": 1,
  "start_date": "2025-07-01",
  "end_date": "2025-07-15",
  "config": {
    "number_of_groups": 8,
    "rounds": 1,
    "home_and_away": false
  },
  "promotion_rules": [
    {
      "type": "top_per_group",
      "config": { "n": 2 }
    }
  ]
}
```

#### Stage 2: Round of 16
```json
POST /api/tournaments/{tournament_id}/stages
{
  "name": "Round of 16",
  "stage_type": "knockout",
  "order": 2,
  "start_date": "2025-07-16",
  "end_date": "2025-07-20",
  "config": {
    "seeding": true,
    "legs": 1
  }
}
```

#### Stage 3: Quarter Finals
```json
POST /api/tournaments/{tournament_id}/stages
{
  "name": "Quarter Finals",
  "stage_type": "knockout",
  "order": 3,
  "start_date": "2025-07-21",
  "end_date": "2025-07-24",
  "config": {
    "seeding": false,
    "legs": 1
  }
}
```

#### Stage 4: Semi Finals
```json
POST /api/tournaments/{tournament_id}/stages
{
  "name": "Semi Finals",
  "stage_type": "knockout",
  "order": 4,
  "start_date": "2025-07-25",
  "end_date": "2025-07-27",
  "config": {
    "seeding": false,
    "legs": 1,
    "third_place_match": true
  }
}
```

#### Stage 5: Final
```json
POST /api/tournaments/{tournament_id}/stages
{
  "name": "Final",
  "stage_type": "knockout",
  "order": 5,
  "start_date": "2025-07-28",
  "end_date": "2025-07-28",
  "config": {
    "legs": 1
  }
}
```

### Step-by-Step: Champions League Style (32 Teams)

#### Stage 1: Group Stage
```json
{
  "name": "Group Stage",
  "stage_type": "group",
  "config": {
    "number_of_groups": 8,
    "rounds": 2,           // Home and away
    "home_and_away": true
  },
  "promotion_rules": [
    {
      "type": "top_per_group",
      "config": { "n": 2 }
    }
  ]
}
```

#### Stage 2: Knockout Rounds
```json
{
  "name": "Round of 16",
  "stage_type": "knockout",
  "config": {
    "seeding": true,
    "legs": 2  // Two-legged ties
  }
}
```

### Step-by-Step: Simple League (10 Teams)

```json
{
  "name": "Full Season",
  "stage_type": "league",
  "config": {
    "rounds": 2,           // Each team plays twice
    "home_and_away": true
  }
}
```

## Promotion Rules

### Top N Teams

**Description:** Promote the top N teams overall from the stage

**Configuration:**
```json
{
  "type": "top_n",
  "config": {
    "n": 8  // Number of teams to promote
  }
}
```

**Use Cases:**
- Swiss system tournaments
- Single league to knockout
- Any scenario where you want best overall teams

**Example:**
- "Top 8 teams advance to playoffs"
- Swiss tournament → Top 16 to knockout

---

### Top Per Group

**Description:** Promote the top N teams from each group

**Configuration:**
```json
{
  "type": "top_per_group",
  "config": {
    "n": 2  // Teams per group to promote
  }
}
```

**Use Cases:**
- Group stages
- Ensuring representation from each group

**Example:**
- World Cup (top 2 from each of 8 groups = 16 teams)
- Champions League (top 2 from each of 8 groups = 16 teams)

---

### Points Threshold

**Description:** Promote all teams that reach a minimum points total

**Configuration:**
```json
{
  "type": "points_threshold",
  "config": {
    "threshold": 10  // Minimum points required
  }
}
```

**Use Cases:**
- Qualification tournaments
- Performance-based advancement
- Flexible team count

**Example:**
- "All teams with 10+ points qualify"
- Olympic qualification (minimum performance standard)

## Common Tournament Structures

### Small Tournament (8 Teams)

**Option 1: Pure Knockout**
```
Stage 1: Quarter Finals (8 teams)
Stage 2: Semi Finals (4 teams)
Stage 3: Final (2 teams)
```

**Option 2: Groups + Final**
```
Stage 1: 2 Groups of 4 (top 2 advance)
Stage 2: Semi Finals (4 teams)
Stage 3: Final (2 teams)
```

### Medium Tournament (16 Teams)

**Option 1: Groups + Knockout**
```
Stage 1: 4 Groups of 4 (top 2 advance)
Stage 2: Quarter Finals (8 teams)
Stage 3: Semi Finals (4 teams)
Stage 4: Final (2 teams)
```

**Option 2: Swiss + Knockout**
```
Stage 1: Swiss 4 rounds (top 8 advance)
Stage 2: Quarter Finals (8 teams)
Stage 3: Semi Finals (4 teams)
Stage 4: Final (2 teams)
```

### Large Tournament (32+ Teams)

**FIFA World Cup Style:**
```
Stage 1: 8 Groups of 4 (top 2 advance) = 16 teams
Stage 2: Round of 16 = 8 teams
Stage 3: Quarter Finals = 4 teams
Stage 4: Semi Finals (with 3rd place match) = 2 teams
Stage 5: Final = 1 champion
```

**Swiss Format:**
```
Stage 1: Swiss 7 rounds (top 16 advance)
Stage 2: Round of 16 = 8 teams
Stage 3: Quarter Finals = 4 teams
Stage 4: Semi Finals = 2 teams
Stage 5: Final = 1 champion
```

## Best Practices

### Planning

1. **Determine Tournament Size**
   - Count expected teams
   - Plan for dropouts (add 10-20% buffer)
   - Choose stage types accordingly

2. **Timeline**
   - Calculate total matches needed
   - Account for match duration
   - Add buffer time between rounds
   - Plan for delays/postponements

3. **Stage Selection**
   - **4-8 teams:** Knockout or single group
   - **9-16 teams:** Groups (2-4) + knockout or Swiss
   - **17-32 teams:** Groups (4-8) + knockout or Swiss
   - **33+ teams:** Swiss system recommended

### Configuration Tips

1. **Group Stages**
   - Ideal group size: 3-5 teams
   - Groups of 3: Quick but less matches
   - Groups of 4: Standard, balanced
   - Groups of 5+: Many matches, time-consuming

2. **Round-Robin**
   - Calculate matches: `n * (n-1) / 2` per round
   - Example: 10 teams = 45 matches per round
   - 2 rounds = 90 total matches

3. **Knockout**
   - Prefer power-of-2 team counts (8, 16, 32)
   - Use byes for non-power-of-2
   - Consider seeding for fairness

4. **Swiss**
   - Recommended rounds: `log₂(teams)` 
   - Example: 16 teams = 4-5 rounds
   - More rounds = better ranking accuracy

### Promotion Best Practices

1. **Be Consistent**
   - Use same promotion type throughout tournament
   - Document rules clearly for participants

2. **Balance Competition**
   - Don't promote too few (makes later stages boring)
   - Don't promote too many (devalues group stage)
   - Sweet spot: 40-60% advancement rate

3. **Consider Tie-Breakers**
   - Rankings auto-apply: Points → GD → GF → H2H
   - Clear tie-breaking rules prevent disputes

## Troubleshooting

### Issue: "Cannot generate fixtures"

**Causes:**
- No teams assigned to stage
- Stage status not 'pending' or 'active'
- Invalid configuration

**Solutions:**
1. Verify teams assigned: `GET /api/stages/{id}?include=teams`
2. Check stage status
3. Validate configuration matches stage type

### Issue: "Teams not promoting"

**Causes:**
- Stage not completed
- No promotion rules configured
- No target stage specified

**Solutions:**
1. Complete all fixtures first
2. Add promotion rules to stage
3. Ensure next stage exists and is linked

### Issue: "Uneven groups"

**Cause:** Number of teams not divisible by number of groups

**Solution:**
- Teams distributed as evenly as possible
- Some groups will have one less team
- Example: 14 teams, 4 groups → 4-4-3-3

### Issue: "Knockout bracket has byes"

**Cause:** Team count is not a power of 2

**Solution:**
- Byes are automatic and expected
- Higher seeded teams get byes
- Or adjust team count to 8, 16, 32, etc.

### Issue: "Rankings not updating"

**Causes:**
- Fixtures not marked complete
- Observer not triggered

**Solutions:**
1. Ensure fixtures have `status: 'completed'`
2. Manually refresh: `POST /api/stages/{id}/rankings/refresh`

## API Quick Reference

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/{id}` - Get tournament details
- `PATCH /api/tournaments/{id}` - Update tournament
- `DELETE /api/tournaments/{id}` - Delete tournament

### Stages
- `GET /api/tournaments/{id}/stages` - List stages
- `POST /api/tournaments/{id}/stages` - Create stage
- `GET /api/stages/{id}` - Get stage details
- `PATCH /api/stages/{id}` - Update stage
- `DELETE /api/stages/{id}` - Delete stage

### Teams & Fixtures
- `POST /api/stages/{id}/assign-teams` - Assign teams
- `GET /api/stages/{id}/simulate-fixtures` - Preview fixtures
- `POST /api/stages/{id}/generate-fixtures` - Generate fixtures

### Rankings & Promotion
- `GET /api/stages/{id}/rankings` - Get rankings
- `POST /api/stages/{id}/rankings/refresh` - Refresh rankings
- `GET /api/stages/{id}/simulate-promotion` - Preview promotion
- `POST /api/stages/{id}/execute-promotion` - Execute promotion

## Advanced Topics

### Custom Scoring Rules

Configure custom points for wins/draws/losses in tournament settings:

```json
{
  "rules": {
    "win_points": 3,
    "draw_points": 1,
    "loss_points": 0
  }
}
```

### Seeding Teams

For knockout stages, assign seeds when assigning teams:

```json
POST /api/stages/{id}/assign-teams
{
  "team_ids": [1, 2, 3, 4],
  "seeds": [1, 2, 3, 4]  // Higher seeds get better bracket positions
}
```

### Two-Legged Ties

For home-and-away knockout rounds:

```json
{
  "stage_type": "knockout",
  "config": {
    "legs": 2  // Creates home and away fixtures
  }
}
```

## Getting Help

- **API Documentation:** Check Postman collection for detailed endpoint docs
- **Code Documentation:** See PHPDoc in service classes
- **Test Examples:** Review integration tests in `tests/Feature/Tournament/`

## Changelog

- **v1.0:** Initial tournament system release
  - League, Group, Knockout, Swiss stage types
  - Multiple promotion rule types
  - Automatic fixture generation
  - Real-time ranking calculation
