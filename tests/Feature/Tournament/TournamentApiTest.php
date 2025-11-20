<?php

namespace Tests\Feature\Tournament;

use App\Enums\StageType;
use App\Enums\TournamentType;
use App\Models\Tournament;
use App\Models\Team;
use App\Models\Turf;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TournamentApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Turf $turf;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create super admin role
        Role::create(['name' => User::ROLE_SUPER_ADMIN]);

        $this->user = User::factory()->create();
        // Give user super admin role to bypass authorization
        $this->user->assignRole(User::ROLE_SUPER_ADMIN);
        $this->turf = Turf::factory()->create(['owner_id' => $this->user->id]);
    }

    public function test_can_create_tournament(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/tournaments', [
                'turf_id' => $this->turf->id,
                'name' => 'Summer Championship',
                'type' => TournamentType::SINGLE_SESSION->value,
                'starts_at' => now()->addDays(7)->toDateTimeString(),
                'ends_at' => now()->addDays(30)->toDateTimeString(),
                'settings' => [
                    'match_duration' => 15,
                    'team_size' => 5,
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'name',
                'type',
                'status',
                'settings',
                'starts_at',
                'ends_at',
            ])
            ->assertJson([
                'name' => 'Summer Championship',
                'type' => 'single_session',
            ]);

        $this->assertDatabaseHas('tournaments', [
            'name' => 'Summer Championship',
            'turf_id' => $this->turf->id,
        ]);
    }

    public function test_can_list_tournaments(): void
    {
        Tournament::factory()->count(3)->create(['turf_id' => $this->turf->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/tournaments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'type'],
                ],
            ])
            ->assertJsonCount(3, 'data');
    }

    public function test_can_view_tournament(): void
    {
        $tournament = Tournament::factory()->create([
            'turf_id' => $this->turf->id,
            'name' => 'Test Tournament',
            'type' => 'single_session',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/tournaments/{$tournament->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id' => $tournament->id,
                'name' => 'Test Tournament',
                'type' => 'single_session',
            ]);
    }

    public function test_can_update_tournament(): void
    {
        $tournament = Tournament::factory()->create([
            'turf_id' => $this->turf->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/tournaments/{$tournament->id}", [
                'name' => 'Updated Tournament Name',
                'settings' => ['match_duration' => 20],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('tournaments', [
            'id' => $tournament->id,
            'name' => 'Updated Tournament Name',
        ]);
    }

    public function test_can_delete_tournament(): void
    {
        $tournament = Tournament::factory()->create([
            'turf_id' => $this->turf->id,
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/tournaments/{$tournament->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('tournaments', [
            'id' => $tournament->id,
        ]);
    }

    public function test_cannot_create_tournament_without_name(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/tournaments', [
                'turf_id' => $this->turf->id,
                'type' => TournamentType::MULTI_STAGE->value,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_cannot_create_tournament_without_turf_id(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/tournaments', [
                'name' => 'Test Tournament',
                'type' => TournamentType::MULTI_STAGE->value,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['turf_id']);
    }

    public function test_unauthenticated_user_cannot_create_tournament(): void
    {
        $response = $this->postJson('/api/tournaments', [
            'turf_id' => $this->turf->id,
            'name' => 'Test Tournament',
        ]);

        $response->assertStatus(401);
    }
}
