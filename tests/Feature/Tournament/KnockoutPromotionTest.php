<?php

use App\Enums\PromotionRuleType;
use App\Enums\StageType;
use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\Stage;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\Turf;
use App\Models\User;
use App\Services\PromotionService;
use App\Services\RankingService;
use App\Services\StageService;

beforeEach(function () {
  $this->user = User::factory()->create();
  $this->turf = Turf::factory()->create(['owner_id' => $this->user->id]);
  $this->promotionService = app(PromotionService::class);
  $this->rankingService = app(RankingService::class);
  $this->stageService = app(StageService::class);

  $this->actingAs($this->user);
});

test('knockout winners handler promotes only winner from knockout bracket', function () {
  // Create tournament with knockout stage
  $tournament = Tournament::create([
    'turf_id' => $this->turf->id,
    'name' => 'Champions Cup',
    'type' => 'multi_stage_tournament',
    'starts_at' => now()->addDays(7),
    'ends_at' => now()->addDays(30),
    'status' => 'pending',
    'created_by' => $this->user->id,
  ]);

  // Create knockout stage
  $knockoutStage = $tournament->stages()->create([
    'name' => 'Semifinals',
    'order' => 1,
    'stage_type' => StageType::KNOCKOUT->value,
    'status' => 'completed',
    'settings' => [
      'match_duration' => 90,
      'match_interval' => 5,
      'legs' => 1,
    ],
  ]);

  // Create final stage to promote to
  $finalStage = $tournament->stages()->create([
    'name' => 'Final',
    'order' => 2,
    'stage_type' => StageType::KNOCKOUT->value,
    'status' => 'pending',
    'settings' => [
      'match_duration' => 90,
      'match_interval' => 5,
      'legs' => 1,
    ],
  ]);

  // Set up promotion rule - only winners advance
  $knockoutStage->promotion()->create([
    'next_stage_id' => $finalStage->id,
    'rule_type' => PromotionRuleType::KNOCKOUT_WINNERS->value,
    'rule_config' => [],
  ]);

  // Create 4 teams
  $matchSession = MatchSession::factory()->create(['turf_id' => $this->turf->id]);
  $teams = Team::factory()->count(4)->create(['match_session_id' => $matchSession->id]);

  // Add teams to knockout stage
  foreach ($teams as $index => $team) {
    $knockoutStage->stageTeams()->create([
      'team_id' => $team->id,
      'seed' => $index + 1,
    ]);
  }

  // Create semifinal fixtures and set winners
  // Semifinal 1: Team 1 vs Team 2 (Team 1 wins)
  $semi1 = GameMatch::create([
    'stage_id' => $knockoutStage->id,
    'first_team_id' => $teams[0]->id,
    'second_team_id' => $teams[1]->id,
    'scheduled_at' => now()->subDay(),
    'status' => 'completed',
    'first_team_score' => 3,
    'second_team_score' => 1,
    'winning_team_id' => $teams[0]->id,
    'metadata' => json_encode([
      'round' => 'Semi-Final',
      'knockout_round' => 'Semi-Final',
      'match_number' => 1,
    ]),
  ]);

  // Semifinal 2: Team 3 vs Team 4 (Team 3 wins)
  $semi2 = GameMatch::create([
    'stage_id' => $knockoutStage->id,
    'first_team_id' => $teams[2]->id,
    'second_team_id' => $teams[3]->id,
    'scheduled_at' => now()->subDay(),
    'status' => 'completed',
    'first_team_score' => 2,
    'second_team_score' => 1,
    'winning_team_id' => $teams[2]->id,
    'metadata' => json_encode([
      'round' => 'Semi-Final',
      'knockout_round' => 'Semi-Final',
      'match_number' => 2,
    ]),
  ]);

  // Final: Team 1 vs Team 3 (Team 1 wins)
  $final = GameMatch::create([
    'stage_id' => $knockoutStage->id,
    'first_team_id' => $teams[0]->id,
    'second_team_id' => $teams[2]->id,
    'scheduled_at' => now(),
    'status' => 'completed',
    'first_team_score' => 2,
    'second_team_score' => 1,
    'winning_team_id' => $teams[0]->id,
    'metadata' => json_encode([
      'round' => 'Final',
      'knockout_round' => 'Final',
      'match_number' => 1,
    ]),
  ]);

  // Simulate promotion (no need to compute rankings for knockout)
  $promotionPreview = $this->promotionService->simulatePromotion($knockoutStage);

  expect($promotionPreview)->toBeArray()
    ->and($promotionPreview)->toHaveKey('promoted_teams')
    ->and($promotionPreview['promoted_teams'])->toHaveCount(2) // Both semifinal winners (Team 1 and Team 3)
    ->and($promotionPreview['promotion_rule'])->toBeInstanceOf(PromotionRuleType::class)
    ->and($promotionPreview['promotion_rule'])->toBe(PromotionRuleType::KNOCKOUT_WINNERS);

  // Verify winners of fixtures are promoted (not based on final ranking)
  $promotedTeamIds = collect($promotionPreview['promoted_teams'])->pluck('id')->toArray();
  expect($promotedTeamIds)->toContain($teams[0]->id) // Semi-final 1 winner and Final winner
    ->and($promotedTeamIds)->toContain($teams[2]->id) // Semi-final 2 winner (also reached final)
    ->and($promotedTeamIds)->not->toContain($teams[1]->id) // Lost in semi-final
    ->and($promotedTeamIds)->not->toContain($teams[3]->id); // Lost in semi-final

  // Execute promotion
  $promotedTeams = $this->promotionService->executePromotion($knockoutStage);

  expect($promotedTeams)->toHaveCount(2); // Both semifinal winners

  // Verify both semifinal winners are added to final stage
  $finalStage->refresh();
  expect($finalStage->stageTeams()->count())->toBe(2);

  $finalStageTeamIds = $finalStage->stageTeams()->pluck('team_id')->toArray();
  expect($finalStageTeamIds)->toContain($teams[0]->id) // Semifinal 1 winner
    ->and($finalStageTeamIds)->toContain($teams[2]->id); // Semifinal 2 winner
});

test('knockout winners handler promotes only winner from simple final', function () {
  // Create tournament with knockout stage
  $tournament = Tournament::create([
    'turf_id' => $this->turf->id,
    'name' => 'Champions Cup',
    'type' => 'multi_stage_tournament',
    'starts_at' => now()->addDays(7),
    'ends_at' => now()->addDays(30),
    'status' => 'pending',
    'created_by' => $this->user->id,
  ]);

  // Create knockout stage
  $knockoutStage = $tournament->stages()->create([
    'name' => 'Final',
    'order' => 1,
    'stage_type' => StageType::KNOCKOUT->value,
    'status' => 'completed',
    'settings' => [
      'match_duration' => 90,
      'match_interval' => 5,
    ],
  ]);

  // Create next stage
  $nextStage = $tournament->stages()->create([
    'name' => 'Winners Circle',
    'order' => 2,
    'stage_type' => StageType::LEAGUE->value,
    'status' => 'pending',
    'settings' => [
      'match_duration' => 90,
      'match_interval' => 5,
    ],
  ]);

  // Set up promotion rule - only winners advance
  $knockoutStage->promotion()->create([
    'next_stage_id' => $nextStage->id,
    'rule_type' => PromotionRuleType::KNOCKOUT_WINNERS->value,
    'rule_config' => [],
  ]);

  // Create 2 teams
  $matchSession = MatchSession::factory()->create(['turf_id' => $this->turf->id]);
  $teams = Team::factory()->count(2)->create(['match_session_id' => $matchSession->id]);

  // Add teams to stage
  foreach ($teams as $index => $team) {
    $knockoutStage->stageTeams()->create([
      'team_id' => $team->id,
      'seed' => $index + 1,
    ]);
  }

  // Create final match
  GameMatch::create([
    'stage_id' => $knockoutStage->id,
    'first_team_id' => $teams[0]->id,
    'second_team_id' => $teams[1]->id,
    'scheduled_at' => now()->subDay(),
    'status' => 'completed',
    'first_team_score' => 2,
    'second_team_score' => 1,
    'winning_team_id' => $teams[0]->id,
    'metadata' => json_encode([
      'round' => 'Final',
      'knockout_round' => 'Final',
      'match_number' => 1,
    ]),
  ]);

  // Compute rankings
  $this->rankingService->computeAndPersist($knockoutStage);

  // Simulate promotion
  $promotionPreview = $this->promotionService->simulatePromotion($knockoutStage);

  expect($promotionPreview['promoted_teams'])->toHaveCount(1);

  $promotedTeamIds = collect($promotionPreview['promoted_teams'])->pluck('id')->toArray();
  expect($promotedTeamIds)->toContain($teams[0]->id)
    ->and($promotedTeamIds)->not->toContain($teams[1]->id);

  // Execute promotion
  $promotedTeams = $this->promotionService->executePromotion($knockoutStage);

  expect($promotedTeams)->toHaveCount(1);

  // Verify only winner is in next stage
  $nextStage->refresh();
  expect($nextStage->stageTeams()->count())->toBe(1);
  expect($nextStage->stageTeams()->first()->team_id)->toBe($teams[0]->id);
});
