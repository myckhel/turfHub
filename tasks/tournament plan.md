Below is a practical, senior-level plan to design a **flexible tournament engine** for TurfHub that can model *any* tournament shape: multi-stage, group/league/knockout, qualifiers, manual/auto fixtures, custom scoring, and promotion rules. The plan is implementation-friendly (Laravel + Inertia patterns in mind) but framework-agnostic.

# Principles (high level)

1. **Data-driven, not hard-coded.** Store stage type, rules, scoring and promotion config in DB/JSON so new formats require no schema changes.
2. **Strategy pattern for behavior.** Implement `StageStrategy` and `PromotionHandler` interfaces so you can plug in new algorithms (league, swiss, bracket, king-of-hill, etc.).
3. **Simulate before commit.** Always provide a “simulate” path that returns generated fixtures / promotions without writing DB.
4. **Manual override & audit.** Admins must be able to override auto choices; record audits for clarity and rollback.
5. **Idempotent background jobs.** Use queued jobs for heavy operations (fixture generation, promotion) and make them safe to re-run.
6. **Composable building blocks.** Tournament → Stages → Groups (optional) → Teams → Fixtures (Matches) → Events/Results.

# Core domain model (essential tables)

Use these as the foundation. Keep flexible `settings` / `config` JSON fields on stages/tournaments.

* `tournaments` (formerly match_sessions)
  `id, name, turf_id, type, settings(json), starts_at (formerly session_date), ends_at, created_by, ...`

* `stages`
  `id, tournament_id, name, order, stage_type(enum), settings(json), promotion_rule_id, next_stage_id, ...`
  `stage_type` examples: `league`, `group`, `knockout`, `king_of_hill`, `swiss`, `custom`.

* `stage_promotions`
  `id, stage_id, next_stage_id, rule_type(enum), rule_config(json)`
  `rule_type` examples: `top_n`, `top_per_group`, `points_threshold`, `top_by_rank`, `custom_handler`.

* `groups`
  `id, stage_id, name, settings(json)`

* `teams` (existing table)
  `tournament_id (formerly match_session_id) nullable, created_by, metadata(json)`

* `stage_teams` (teams assigned to a specific stage)
  `id, stage_id, team_id, seed, group_id nullable, metadata(json)`

* `fixtures` (formerly game_matches)
  `id, stage_id, group_id nullable, home_team_id, away_team_id, starts_at, duration, status, score (json), winner_team_id nullable, metadata(json)`

* `match_events` (existing table)
  `id, fixture_id, payload(json), created_by`

* `rankings` (computed, optional persisted)
  `id, stage_id, group_id nullable, team_id, points, played, wins, draws, losses, gd, rank`

* `promotion_audits`
  `id, stage_id, triggered_by, simulated boolean, result json, created_at`

# Config patterns (what to store in JSON)

* `stage.settings`:

```json
{
  "match_duration": 12,
  "team_size_min": 3,
  "team_size_max": 6,
  "scoring": {"win":3,"draw":1,"loss":0},
  "rounds": 1,
  "home_away": false
}
```

* `stage_promotions.rule_config`:

```json
{ "type":"top_n", "n":2 } 
// or { "type":"top_per_group", "n":1 }
// or custom: { "handler_class":"CustomPromotion\\HighestGoalsHandler", "params": {} }
```

# Strategy & extensibility (code patterns)

* Define interfaces:

  * `StageStrategyInterface { generateFixtures(Stage $stage): array; computeRankings(Stage $stage): RankingCollection; }`
  * `PromotionHandlerInterface { selectWinners(Stage $stage): Collection; }`
* Concrete strategies: `LeagueStrategy`, `DoubleRoundRobinStrategy`, `GroupStrategy`, `KnockoutStrategy`, `SwissStrategy`, `KingOfHillStrategy`.
* Promotion handlers: `TopNHandler`, `TopPerGroupHandler`, `PointsThresholdHandler`, `CustomHandler` (resolve class by string).
* Factory to map `stage_type -> StageStrategy`.

# Fixture generation approaches

* **League / Round Robin:** Round-robin pairing algorithm (circle method). For double round-robin, generate mirror fixtures with swapped home/away.
* **Groups:** Divide stage_teams into `k` groups, then apply round-robin per group. Use `settings.group_size`.
* **Knockout:** Seed teams (by ranking/seed field), generate bracket pairs. Support best-of-N or two-legged ties.
* **Swiss:** Use pairing by ranking each round; keep records to prevent repeats (Swiss pairing algorithm).
* **King-of-Hill / Queue:** Maintain queue of teams; generate next match as front two teams; adjust queue on result.

# Promotion engine (pseudocode)

```text
function promoteStage(stageId, simulate=false):
  stage = Stage::with('stage_teams','groups','matches')->find(stageId)
  rankings = StageStrategyFactory.for(stage.type).computeRankings(stage)
  rule = stage.promotion
  winners = PromotionFactory.make(rule.type, rule.config).selectWinners(stage, rankings)

  if simulate:
    return { winners, preview_next_stage_slots }
  
  DB::transaction(() => {
    attach winners to next_stage with seeds
    GenerateMatchesForStageJob::dispatch(next_stage.id)
    record promotion_audits with result
  })
```

* Always `simulate` first in UI before commit.
* Allow manual selection UI to override winners.

# Ranking & tie-breakers

* Provide configurable tie-break sequence in `stage.settings`, e.g.: goal difference → goals for → head-to-head → fair-play → random.
* After each match result, fire `MatchCompleted` event → queue `ComputeRankingsJob(stage_id)` which recomputes persisted rankings.

# UI & UX

* **Tournament Composer:** Admin creates tournament -> adds stages (orderable) -> configures each stage settings + promotion rules + group creation policy.
* **Stage Composer:** For each stage allow:

  * Choose stage type (league/group/knockout/king_of_hill)
  * Configure settings (match length, team sizes, scoring)
  * Configure promotion rule (visual composer: top N, top X per group, custom)
  * Option to `simulate` generation
* **Fixture Generator UI:** Offer `Auto Generate` (based on strategy) and `Manual Mode` (drag & drop seeds, manual pairings).
* **Promotion Preview:** Visualizable bracket or group table showing promoted teams before commit.
* **Audit Trail UI:** Who simulated, who executed, time, seeds chosen.

# APIs & Admin endpoints (examples)

* `POST /tournaments` create tournament
* `POST /tournaments/{id}/stages` add stage
* `GET /stages/{id}/simulate-fixtures` returns proposed fixtures
* `POST /stages/{id}/generate-fixtures?mode=auto|manual`
* `GET /stages/{id}/simulate-promotion`
* `POST /stages/{id}/promote` perform promotion
* `POST /matches/{id}/result` submit result
* `GET /tournaments/{id}/export` export fixtures/rankings

# Jobs, Events, Observability

* Jobs: `GenerateFixturesJob`, `ComputeRankingsJob`, `PromoteStageJob`, `NotifyTeamsJob`.
* Events: `FixturesGenerated`, `MatchCompleted`, `RankingsUpdated`, `StagePromoted`.
* Logs/audit & metrics: record runtime, number of teams, errors; keep promotion audits.

# Manual override & admin controls

* Allow admin to:

  * Swap seeds before commit
  * Force-promote or disqualify teams
  * Recompute rankings or re-run promotion
* Provide soft rollback: keep snapshots of stage assignments prior to promotions.

# Storage & scaling considerations

* Cache rankings (Redis) and invalidate on match complete.
* Index tables: `matches(stage_id)`, `stage_teams(stage_id)`, `rankings(stage_id, team_id)`.
* Large tournaments: chunk operations in jobs, rate-limit heavy recompute.
* Use read replicas for leaderboard-heavy reads.

# Testing & validation

* Unit tests for: round-robin generator, bracket generator, Swiss pairings, tie-break rules, promotion handlers.
* Integration tests: full flow simulate -> generate -> commit -> run matches -> promote.
* Edge cases: odd team counts (use byes), disqualified/withdrawn teams, identical tie-break stats (deterministic seeded RNG).

# Example JSON tournament definition (single resource drives all)

```json
{
  "name":"Summer Cup",
  "settings":{"location":"Lagos"},
  "stages":[
    {
      "name":"Qualifiers",
      "order": 1,
      "stage_type":"group",
      "settings":{"group_size":4,"match_duration":12,"scoring":{"win":3,"draw":1,"loss":0}},
      "promotion_rule":{"type":"top_per_group","config":{"n":1}},
      "next_stage":"Knockout Round"
    },
    {
      "name":"Knockout Round",
      "order":2,
      "stage_type":"knockout",
      "settings":{"match_duration":15,"single_leg":true},
      "promotion_rule":{"type":"top_n","config":{"n":1}}
    }
  ]
}
```

# Final tips

* Model behavior via small, well-tested strategy classes; keep DB as source of truth.
* Keep admin UI forgiving: simulate, preview, and then commit.
* Start with the most common formats (league, group, knockout) then add more exotic ones by implementing new strategies/handlers.
* Document promotion rules and provide human-readable explanations in the UI so managers understand why a team advanced.
