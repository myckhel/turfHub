<?php

namespace Tests\Feature;

use App\Models\Player;
use App\Models\Turf;
use App\Models\User;
use App\Services\TurfPermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlayerRoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected TurfPermissionService $turfPermissionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->turfPermissionService = app(TurfPermissionService::class);
    }

    /** @test */
    public function admin_can_update_player_role_to_manager(): void
    {
        // Create turf and users
        $admin = User::factory()->create();
        $player = User::factory()->create();
        $turf = Turf::factory()->create(['owner_id' => $admin->id]);

        // Add admin and player to turf
        $adminPlayer = $this->turfPermissionService->addPlayerToTurf($admin, $turf, User::TURF_ROLE_ADMIN);
        $playerToUpdate = $this->turfPermissionService->addPlayerToTurf($player, $turf, User::TURF_ROLE_PLAYER);

        // Admin updates player role to manager
        $response = $this->actingAs($admin)
            ->putJson(route('api.players.update-role', ['player' => $playerToUpdate->id]), [
                'role' => User::TURF_ROLE_MANAGER,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'user_id',
                'turf_id',
                'role',
                'role_label',
                'is_admin',
                'is_manager',
            ]);

        $this->assertEquals(User::TURF_ROLE_MANAGER, $response->json('role'));
        $this->assertTrue($response->json('is_manager'));
        $this->assertFalse($response->json('is_admin'));

        // Verify in database
        $this->assertTrue($player->hasRoleOnTurf(User::TURF_ROLE_MANAGER, $turf->id));
        $this->assertFalse($player->hasRoleOnTurf(User::TURF_ROLE_PLAYER, $turf->id));
    }

    /** @test */
    public function admin_can_promote_manager_to_admin(): void
    {
        $admin = User::factory()->create();
        $manager = User::factory()->create();
        $turf = Turf::factory()->create(['owner_id' => $admin->id]);

        $this->turfPermissionService->addPlayerToTurf($admin, $turf, User::TURF_ROLE_ADMIN);
        $managerPlayer = $this->turfPermissionService->addPlayerToTurf($manager, $turf, User::TURF_ROLE_MANAGER);

        $response = $this->actingAs($admin)
            ->putJson(route('api.players.update-role', ['player' => $managerPlayer->id]), [
                'role' => User::TURF_ROLE_ADMIN,
            ]);

        $response->assertStatus(200);
        $this->assertEquals(User::TURF_ROLE_ADMIN, $response->json('role'));
        $this->assertTrue($response->json('is_admin'));
        $this->assertTrue($manager->hasRoleOnTurf(User::TURF_ROLE_ADMIN, $turf->id));
    }

    /** @test */
    public function admin_can_demote_admin_to_player(): void
    {
        $superAdmin = User::factory()->create();
        $adminToDemote = User::factory()->create();
        $turf = Turf::factory()->create(['owner_id' => $superAdmin->id]);

        $this->turfPermissionService->addPlayerToTurf($superAdmin, $turf, User::TURF_ROLE_ADMIN);
        $adminPlayer = $this->turfPermissionService->addPlayerToTurf($adminToDemote, $turf, User::TURF_ROLE_ADMIN);

        $response = $this->actingAs($superAdmin)
            ->putJson(route('api.players.update-role', ['player' => $adminPlayer->id]), [
                'role' => User::TURF_ROLE_PLAYER,
            ]);

        $response->assertStatus(200);
        $this->assertEquals(User::TURF_ROLE_PLAYER, $response->json('role'));
        $this->assertFalse($response->json('is_admin'));
        $this->assertTrue($adminToDemote->hasRoleOnTurf(User::TURF_ROLE_PLAYER, $turf->id));
    }

    /** @test */
    public function manager_cannot_update_player_roles(): void
    {
        $manager = User::factory()->create();
        $player = User::factory()->create();
        $turf = Turf::factory()->create();

        $this->turfPermissionService->addPlayerToTurf($manager, $turf, User::TURF_ROLE_MANAGER);
        $playerToUpdate = $this->turfPermissionService->addPlayerToTurf($player, $turf, User::TURF_ROLE_PLAYER);

        $response = $this->actingAs($manager)
            ->putJson(route('api.players.update-role', ['player' => $playerToUpdate->id]), [
                'role' => User::TURF_ROLE_MANAGER,
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function player_cannot_update_player_roles(): void
    {
        $player1 = User::factory()->create();
        $player2 = User::factory()->create();
        $turf = Turf::factory()->create();

        $this->turfPermissionService->addPlayerToTurf($player1, $turf, User::TURF_ROLE_PLAYER);
        $playerToUpdate = $this->turfPermissionService->addPlayerToTurf($player2, $turf, User::TURF_ROLE_PLAYER);

        $response = $this->actingAs($player1)
            ->putJson(route('api.players.update-role', ['player' => $playerToUpdate->id]), [
                'role' => User::TURF_ROLE_ADMIN,
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function unauthenticated_user_cannot_update_roles(): void
    {
        $turf = Turf::factory()->create();
        $player = User::factory()->create();
        $playerRecord = $this->turfPermissionService->addPlayerToTurf($player, $turf, User::TURF_ROLE_PLAYER);

        $response = $this->putJson(route('api.players.update-role', ['player' => $playerRecord->id]), [
            'role' => User::TURF_ROLE_ADMIN,
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function role_field_is_required(): void
    {
        $admin = User::factory()->create();
        $player = User::factory()->create();
        $turf = Turf::factory()->create(['owner_id' => $admin->id]);

        $this->turfPermissionService->addPlayerToTurf($admin, $turf, User::TURF_ROLE_ADMIN);
        $playerToUpdate = $this->turfPermissionService->addPlayerToTurf($player, $turf, User::TURF_ROLE_PLAYER);

        $response = $this->actingAs($admin)
            ->putJson(route('api.players.update-role', ['player' => $playerToUpdate->id]), []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    /** @test */
    public function role_must_be_valid(): void
    {
        $admin = User::factory()->create();
        $player = User::factory()->create();
        $turf = Turf::factory()->create(['owner_id' => $admin->id]);

        $this->turfPermissionService->addPlayerToTurf($admin, $turf, User::TURF_ROLE_ADMIN);
        $playerToUpdate = $this->turfPermissionService->addPlayerToTurf($player, $turf, User::TURF_ROLE_PLAYER);

        $response = $this->actingAs($admin)
            ->putJson(route('api.players.update-role', ['player' => $playerToUpdate->id]), [
                'role' => 'invalid_role',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    /** @test */
    public function player_resource_includes_role_information(): void
    {
        $admin = User::factory()->create();
        $turf = Turf::factory()->create(['owner_id' => $admin->id]);
        $playerRecord = $this->turfPermissionService->addPlayerToTurf($admin, $turf, User::TURF_ROLE_ADMIN);

        $response = $this->actingAs($admin)
            ->getJson(route('api.players.show', ['player' => $playerRecord->id]));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'role',
                'role_label',
                'is_admin',
                'is_manager',
            ]);

        $this->assertEquals(User::TURF_ROLE_ADMIN, $response->json('role'));
        $this->assertEquals('Admin', $response->json('role_label'));
        $this->assertTrue($response->json('is_admin'));
    }

    /** @test */
    public function admin_from_different_turf_cannot_update_roles(): void
    {
        $admin1 = User::factory()->create();
        $admin2 = User::factory()->create();
        $turf1 = Turf::factory()->create(['owner_id' => $admin1->id]);
        $turf2 = Turf::factory()->create(['owner_id' => $admin2->id]);

        $this->turfPermissionService->addPlayerToTurf($admin1, $turf1, User::TURF_ROLE_ADMIN);
        $this->turfPermissionService->addPlayerToTurf($admin2, $turf2, User::TURF_ROLE_ADMIN);

        $player = User::factory()->create();
        $playerInTurf1 = $this->turfPermissionService->addPlayerToTurf($player, $turf1, User::TURF_ROLE_PLAYER);

        // Admin from turf2 tries to update player in turf1
        $response = $this->actingAs($admin2)
            ->putJson(route('api.players.update-role', ['player' => $playerInTurf1->id]), [
                'role' => User::TURF_ROLE_MANAGER,
            ]);

        $response->assertStatus(403);
    }
}
