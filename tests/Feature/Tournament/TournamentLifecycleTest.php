<?php

namespace Tests\Feature\Tournament;

use App\Enums\FixtureStatus;
use App\Enums\StageStatus;
use App\Enums\StageType;
use App\Enums\TournamentType;
use App\Models\GameMatch;
use App\Models\MatchSession;
use App\Models\Player;
use App\Models\Ranking;
use App\Models\Stage;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\Turf;
use App\Models\User;
use App\Services\FixtureGenerationService;
use App\Services\PromotionService;
use App\Services\RankingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TournamentLifecycleTest extends TestCase
{
  use RefreshDatabase;

  protected User $user;
  protected Turf $turf;
  protected FixtureGenerationService $fixtureService;
  protected RankingService $rankingService;
  protected PromotionService $promotionService;

  protected function setUp(): void
  {
    parent::setUp();

    // Reset cached roles and permissions
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    // Create super admin role
    Role::create(['name' => User::ROLE_SUPER_ADMIN]);

    $this->user = User::factory()->create();
    $this->user->assignRole(User::ROLE_SUPER_ADMIN);
    $this->turf = Turf::factory()->create(['owner_id' => $this->user->id]);

    // Initialize services
    $this->fixtureService = app(FixtureGenerationService::class);
    $this->rankingService = app(RankingService::class);
    $this->promotionService = app(PromotionService::class);
  }

  public function test_complete_single_stage_tournament_lifecycle(): void
  {
    // Step 1: Create tournament
    $tournament = Tournament::create([
      'turf_id' => $this->turf->id,
      'name' => 'Champions League',
      'type' => TournamentType::SINGLE_SESSION->value,
      'starts_at' => now()->addDays(7),
      'ends_at' => now()->addDays(30),
      'status' => 'pending',
      'created_by' => $this->user->id,
      'settings' => [
        'match_duration' => 15,
        'team_size' => 5,
      ],
    ]);

    $this->assertDatabaseHas('tournaments', [
      'id' => $tournament->id,
      'name' => 'Champions League',
    ]);

    // Step 2: Create a league stage
    $stage = Stage::create([
      'tournament_id' => $tournament->id,
      'name' => 'League Phase',
      'order' => 1,
      'stage_type' => StageType::LEAGUE->value,
      'status' => StageStatus::PENDING->value,
      'settings' => [
        'rounds' => 2,
        'home_and_away' => true,
      ],
    ]);

    // Step 3: Create teams and assign to stage
    $matchSession = MatchSession::factory()->create(['turf_id' => $this->turf->id]);
    $teams = Team::factory()->count(4)->create([
      'match_session_id' => $matchSession->id,
    ]);

    foreach ($teams as $index => $team) {
      $stage->stageTeams()->create([
        'team_id' => $team->id,
        'seed' => $index + 1,
      ]);
    }

    $this->assertEquals(4, $stage->stageTeams()->count());

    // Step 4: Generate fixtures
    $fixtures = $this->fixtureService->generateFixtures($stage);

    $this->assertGreaterThan(0, $fixtures->count());
    $this->assertEquals(12, $fixtures->count()); // 4 teams round-robin double = 12 matches

    // Step 5: Simulate playing matches and recording results
    foreach ($fixtures as $fixture) {
      // Simulate match completion
      $homeScore = rand(0, 5);
      $awayScore = rand(0, 5);

      $fixture->update([
        'status' => FixtureStatus::COMPLETED->value,
        'score' => [
          'home' => $homeScore,
          'away' => $awayScore,
        ],
        'first_team_score' => $homeScore,
        'second_team_score' => $awayScore,
      ]);
    }

    // Step 6: Compute rankings
    $rankings = $this->rankingService->computeStageRankings($stage);

    $this->assertEquals(4, $rankings->count());
    $this->assertDatabaseHas('rankings', [
      'stage_id' => $stage->id,
    ]);

    // Verify rankings are sorted by points
    $prevPoints = PHP_INT_MAX;
    foreach ($rankings as $ranking) {
      $this->assertLessThanOrEqual($prevPoints, $ranking['points']);
      $prevPoints = $ranking['points'];
      $this->assertEquals(6, $ranking['played']); // Each team plays 6 matches
    }

    // Step 7: Mark stage as completed
    $stage->update(['status' => StageStatus::COMPLETED->value]);

    // Verify final state
    $this->assertEquals(StageStatus::COMPLETED, $stage->fresh()->status);
    $this->assertEquals(12, GameMatch::where('stage_id', $stage->id)->count());
    $this->assertEquals(4, Ranking::where('stage_id', $stage->id)->count());
  }

  public function test_multi_stage_tournament_with_promotion(): void
  {
    // Step 1: Create multi-stage tournament
    $tournament = Tournament::create([
      'turf_id' => $this->turf->id,
      'name' => 'World Cup',
      'type' => TournamentType::MULTI_STAGE->value,
      'starts_at' => now()->addDays(7),
      'ends_at' => now()->addDays(60),
      'status' => 'pending',
      'created_by' => $this->user->id,
      'settings' => [
        'match_duration' => 20,
        'team_size' => 7,
      ],
    ]);

    // Step 2: Create group stage
    $groupStage = Stage::create([
      'tournament_id' => $tournament->id,
      'name' => 'Group Stage',
      'order' => 1,
      'stage_type' => StageType::GROUP->value,
      'status' => StageStatus::PENDING->value,
      'settings' => [
        'groups_count' => 2,
        'rounds' => 1,
      ],
    ]);

    // Step 3: Create knockout stage (next stage)
    $knockoutStage = Stage::create([
      'tournament_id' => $tournament->id,
      'name' => 'Knockout Stage',
      'order' => 2,
      'stage_type' => StageType::KNOCKOUT->value,
      'status' => StageStatus::PENDING->value,
      'settings' => [
        'double_leg' => false,
      ],
    ]);

    // Link stages
    $groupStage->update(['next_stage_id' => $knockoutStage->id]);

    // Step 4: Create promotion rule
    $groupStage->promotion()->create([
      'next_stage_id' => $knockoutStage->id,
      'rule_type' => 'top_per_group',
      'rule_config' => ['n' => 2], // Top 2 from each group
    ]);

    // Step 5: Create groups
    $groupA = $groupStage->groups()->create(['name' => 'Group A']);
    $groupB = $groupStage->groups()->create(['name' => 'Group B']);

    // Step 6: Create teams and distribute to groups
    $matchSession = MatchSession::factory()->create(['turf_id' => $this->turf->id]);
    $teams = Team::factory()->count(8)->create([
      'match_session_id' => $matchSession->id,
    ]);

    foreach ($teams->take(4) as $index => $team) {
      $groupStage->stageTeams()->create([
        'team_id' => $team->id,
        'group_id' => $groupA->id,
        'seed' => $index + 1,
      ]);
    }

    foreach ($teams->skip(4) as $index => $team) {
      $groupStage->stageTeams()->create([
        'team_id' => $team->id,
        'group_id' => $groupB->id,
        'seed' => $index + 1,
      ]);
    }

    // Step 7: Generate fixtures for groups
    $fixtures = $this->fixtureService->generateFixtures($groupStage);

    // Should have fixtures for both groups (4 teams in each = 6 matches per group)
    $this->assertEquals(12, $fixtures->count());

    // Step 8: Play all matches
    foreach ($fixtures as $fixture) {
      $homeScore = rand(0, 5);
      $awayScore = rand(0, 5);

      $fixture->update([
        'status' => FixtureStatus::COMPLETED->value,
        'score' => [
          'home' => $homeScore,
          'away' => $awayScore,
        ],
        'first_team_score' => $homeScore,
        'second_team_score' => $awayScore,
      ]);
    }

    // Step 9: Compute rankings
    $rankings = $this->rankingService->computeStageRankings($groupStage);

    $this->assertEquals(8, $rankings->count());

    // Verify each group has 4 teams ranked
    $groupARankings = collect($rankings)->where('group_id', $groupA->id);
    $groupBRankings = collect($rankings)->where('group_id', $groupB->id);

    $this->assertEquals(4, $groupARankings->count());
    $this->assertEquals(4, $groupBRankings->count());

    // Step 10: Simulate promotion
    $promotionPreview = $this->promotionService->simulatePromotion($groupStage);

    $this->assertIsArray($promotionPreview);
    $this->assertArrayHasKey('promoted_teams', $promotionPreview);
    $this->assertCount(4, $promotionPreview['promoted_teams']); // Top 2 from each group

    // Step 11: Execute promotion
    $groupStage->update(['status' => StageStatus::COMPLETED->value]);

    // Set authenticated user for promotion audit
    \Illuminate\Support\Facades\Auth::login($this->user);
    $promotedTeams = $this->promotionService->executePromotion($groupStage);

    $this->assertCount(4, $promotedTeams);

    // Step 12: Verify promoted teams are assigned to knockout stage
    $knockoutStage->refresh();
    $this->assertEquals(4, $knockoutStage->stageTeams()->count());

    // Verify promotion audit was created
    $this->assertDatabaseHas('promotion_audits', [
      'stage_id' => $groupStage->id,
      'simulated' => false,
    ]);

    // Step 13: Generate knockout fixtures
    $knockoutFixtures = $this->fixtureService->generateFixtures($knockoutStage);

    // 4 teams knockout = 2 semi-final matches
    $this->assertEquals(2, $knockoutFixtures->count());
  }

  public function test_swiss_system_tournament(): void
  {
    // Create tournament
    $tournament = Tournament::create([
      'turf_id' => $this->turf->id,
      'name' => 'Swiss Championship',
      'type' => TournamentType::SINGLE_SESSION->value,
      'starts_at' => now()->addDays(7),
      'ends_at' => now()->addDays(30),
      'status' => 'pending',
      'created_by' => $this->user->id,
    ]);

    // Create Swiss stage
    $stage = Stage::create([
      'tournament_id' => $tournament->id,
      'name' => 'Swiss Rounds',
      'order' => 1,
      'stage_type' => StageType::SWISS->value,
      'status' => StageStatus::PENDING->value,
      'settings' => [
        'rounds' => 3,
      ],
    ]);

    // Create teams
    $matchSession = MatchSession::factory()->create(['turf_id' => $this->turf->id]);
    $teams = Team::factory()->count(8)->create([
      'match_session_id' => $matchSession->id,
    ]);

    foreach ($teams as $index => $team) {
      $stage->stageTeams()->create([
        'team_id' => $team->id,
        'seed' => $index + 1,
      ]);
    }

    // Round 1: Generate initial pairings
    $round1Fixtures = $this->fixtureService->generateFixtures($stage);
    $this->assertEquals(4, $round1Fixtures->count()); // 8 teams = 4 matches

    // Verify fixtures were created
    $this->assertEquals(4, GameMatch::where('stage_id', $stage->id)->count());

    // Mark stage as completed
    $stage->update(['status' => StageStatus::COMPLETED->value]);
    $this->assertTrue($stage->fresh()->isCompleted());
  }

  public function test_ranking_recalculation_after_match_result(): void
  {
    // Setup tournament and stage
    $tournament = Tournament::create([
      'turf_id' => $this->turf->id,
      'name' => 'Test Tournament',
      'type' => TournamentType::SINGLE_SESSION->value,
      'starts_at' => now()->addDays(7),
      'status' => 'pending',
      'created_by' => $this->user->id,
    ]);

    $stage = Stage::create([
      'tournament_id' => $tournament->id,
      'name' => 'League',
      'stage_type' => StageType::LEAGUE->value,
      'status' => StageStatus::ACTIVE->value,
    ]);

    $matchSession = MatchSession::factory()->create(['turf_id' => $this->turf->id]);
    $teams = Team::factory()->count(4)->create([
      'match_session_id' => $matchSession->id,
    ]);

    foreach ($teams as $index => $team) {
      $stage->stageTeams()->create(['team_id' => $team->id, 'seed' => $index + 1]);
    }

    // Generate fixtures
    $fixtures = $this->fixtureService->generateFixtures($stage);

    // Play first match
    $firstMatch = $fixtures->first();
    $firstMatch->update([
      'status' => FixtureStatus::COMPLETED->value,
      'first_team_score' => 3,
      'second_team_score' => 1,
      'score' => ['home' => 3, 'away' => 1],
    ]);

    // Compute rankings
    $rankings = $this->rankingService->computeStageRankings($stage);

    $this->assertNotEmpty($rankings);
    $this->assertEquals(4, $rankings->count());

    // Verify at least one team has won points
    $hasWinner = false;
    foreach ($rankings as $ranking) {
      if (isset($ranking['wins']) && $ranking['wins'] > 0) {
        $hasWinner = true;
        $this->assertGreaterThan(0, $ranking['points']);
        break;
      }
    }

    $this->assertTrue($hasWinner, 'At least one team should have a win');
  }
}
