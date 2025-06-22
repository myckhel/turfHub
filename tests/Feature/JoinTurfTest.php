<?php

use App\Models\Player;
use App\Models\Turf;
use App\Models\User;

beforeEach(function () {
  // Create roles and permissions
  $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
});

test('user can join active turf', function () {
  // Create a turf owner
  $owner = User::factory()->create();

  // Create an active turf
  $turf = Turf::factory()->create([
    'owner_id' => $owner->id,
    'is_active' => true,
    'requires_membership' => false,
  ]);

  // Create a regular user
  $user = User::factory()->player()->create();

  // User joins the turf
  $response = $this->actingAs($user, 'sanctum')
    ->postJson("/api/turfs/{$turf->id}/join", [
      'is_member' => false
    ]);

  $response->assertStatus(201);
  $response->assertJsonStructure([
    'data' => [
      'id',
      'user_id',
      'turf_id',
      'is_member',
      'status',
      'created_at',
      'updated_at'
    ]
  ]);

  // Verify player record was created
  expect($this->app['db']->table('players')->where([
    'user_id' => $user->id,
    'turf_id' => $turf->id,
    'status' => 'active',
    'is_member' => false,
  ])->exists())->toBeTrue();

  // Verify user has player role in turf
  expect($user->belongsToTurf($turf->id))->toBeTrue();
});

test('user can join turf as member', function () {
  // Create a turf owner
  $owner = User::factory()->create();

  // Create an active turf that requires membership
  $turf = Turf::factory()->create([
    'owner_id' => $owner->id,
    'is_active' => true,
    'requires_membership' => true,
    'membership_fee' => 100.00,
  ]);

  // Create a regular user
  $user = User::factory()->player()->create();

  // User joins the turf as a member
  $response = $this->actingAs($user, 'sanctum')
    ->postJson("/api/turfs/{$turf->id}/join", [
      'is_member' => true
    ]);

  $response->assertStatus(201);

  // Verify player record was created with membership
  expect($this->app['db']->table('players')->where([
    'user_id' => $user->id,
    'turf_id' => $turf->id,
    'status' => 'active',
    'is_member' => true,
  ])->exists())->toBeTrue();
});

test('owner cannot join own turf', function () {
  // Create a turf owner
  $owner = User::factory()->create();

  // Create an active turf
  $turf = Turf::factory()->create([
    'owner_id' => $owner->id,
    'is_active' => true,
  ]);

  // Owner tries to join their own turf
  $response = $this->actingAs($owner, 'sanctum')
    ->postJson("/api/turfs/{$turf->id}/join");

  $response->assertStatus(403);
});

test('user cannot join inactive turf', function () {
  // Create a turf owner
  $owner = User::factory()->create();

  // Create an inactive turf
  $turf = Turf::factory()->create([
    'owner_id' => $owner->id,
    'is_active' => false,
  ]);

  // Create a regular user
  $user = User::factory()->player()->create();

  // User tries to join inactive turf
  $response = $this->actingAs($user, 'sanctum')
    ->postJson("/api/turfs/{$turf->id}/join");

  $response->assertStatus(403);
});

test('user can leave turf', function () {
  // Create a turf owner
  $owner = User::factory()->create();

  // Create an active turf
  $turf = Turf::factory()->create([
    'owner_id' => $owner->id,
    'is_active' => true,
  ]);

  // Create a regular user and player record
  $user = User::factory()->player()->create();
  $player = Player::factory()->create([
    'user_id' => $user->id,
    'turf_id' => $turf->id,
    'status' => 'active',
  ]);

  // Assign player role
  $turfPermissionService = app(\App\Services\TurfPermissionService::class);
  $turfPermissionService->assignRoleToUserInTurf($user, User::TURF_ROLE_PLAYER, $turf->id);

  // Verify user belongs to turf before leaving
  expect($user->belongsToTurf($turf->id))->toBeTrue();

  // User leaves the turf
  $response = $this->actingAs($user, 'sanctum')
    ->deleteJson("/api/turfs/{$turf->id}/leave");

  $response->assertStatus(204);

  // Verify player record was deleted
  expect($this->app['db']->table('players')->where([
    'user_id' => $user->id,
    'turf_id' => $turf->id,
  ])->exists())->toBeFalse();

  // Fresh user and test individual role checks
  $user = User::find($user->id);

  // Clear any cached permissions
  app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

  // Debug: check individual role methods
  $isAdmin = $user->isTurfAdmin($turf->id);
  $isManager = $user->isTurfManager($turf->id);
  $isPlayer = $user->isTurfPlayer($turf->id);

  expect($isAdmin)->toBeFalse('User should not be admin');
  expect($isManager)->toBeFalse('User should not be manager');
  expect($isPlayer)->toBeFalse('User should not be player');

  // Now check belongsToTurf
  expect($user->belongsToTurf($turf->id))->toBeFalse();
});

test('unauthenticated user cannot join turf', function () {
  // Create a turf
  $turf = Turf::factory()->create(['is_active' => true]);

  // Unauthenticated request
  $response = $this->postJson("/api/turfs/{$turf->id}/join");

  $response->assertStatus(401);
});
