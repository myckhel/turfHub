<?php

use App\Models\Player;
use App\Models\Turf;
use App\Models\User;

beforeEach(function () {
  // Create roles and permissions
  $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);
});

test('user permissions are correctly isolated per turf in collection', function () {
  // Create a user
  $user = User::factory()->create();

  // Create first turf where user is admin
  $turf1 = Turf::factory()->create(['is_active' => true]);
  $turfPermissionService = new \App\Services\TurfPermissionService();
  $turfPermissionService->addPlayerToTurf($user, $turf1, User::TURF_ROLE_ADMIN);

  // Create second turf where user is just a player
  $turf2 = Turf::factory()->create(['is_active' => true]);
  $turfPermissionService->addPlayerToTurf($user, $turf2, User::TURF_ROLE_PLAYER);

  // Create third turf where user has no role
  $turf3 = Turf::factory()->create(['is_active' => true]);

  // Make API request to get all turfs
  $response = $this->actingAs($user, 'sanctum')
    ->getJson('/api/turfs');

  $response->assertStatus(200);
  $turfs = $response->json('data');

  // Find each turf in the response
  $turfData1 = collect($turfs)->firstWhere('id', $turf1->id);
  $turfData2 = collect($turfs)->firstWhere('id', $turf2->id);
  $turfData3 = collect($turfs)->firstWhere('id', $turf3->id);

  // Verify permissions are different for each turf
  expect($turfData1)->not->toBeNull()
    ->and($turfData1['user_permissions']['role_in_turf'])->toBe('admin')
    ->and($turfData1['user_permissions']['can_manage_turf'])->toBe(true);

  expect($turfData2)->not->toBeNull()
    ->and($turfData2['user_permissions']['role_in_turf'])->toBe('player')
    ->and($turfData2['user_permissions']['can_manage_turf'])->toBe(false);

  expect($turfData3)->not->toBeNull()
    ->and($turfData3['user_permissions']['role_in_turf'])->toBeNull()
    ->and($turfData3['user_permissions']['can_manage_turf'])->toBe(false);
});

test('user belonging turfs returns correct permissions per turf', function () {
  // Create a user
  $user = User::factory()->create();

  // Create first turf where user is manager
  $turf1 = Turf::factory()->create(['is_active' => true]);
  $turfPermissionService = new \App\Services\TurfPermissionService();
  $turfPermissionService->addPlayerToTurf($user, $turf1, User::TURF_ROLE_MANAGER);

  // Create second turf where user is player
  $turf2 = Turf::factory()->create(['is_active' => true]);
  $turfPermissionService->addPlayerToTurf($user, $turf2, User::TURF_ROLE_PLAYER);

  // Make API request to get user's turfs
  $response = $this->actingAs($user, 'sanctum')
    ->getJson("/api/users/{$user->id}/belonging-turfs");

  $response->assertStatus(200);
  $turfs = $response->json('data');

  // Find each turf in the response
  $turfData1 = collect($turfs)->firstWhere('id', $turf1->id);
  $turfData2 = collect($turfs)->firstWhere('id', $turf2->id);

  // Verify permissions are correctly different
  expect($turfData1)->not->toBeNull()
    ->and($turfData1['user_permissions']['role_in_turf'])->toBe('manager')
    ->and($turfData1['user_permissions']['can_invite_players'])->toBe(true);

  expect($turfData2)->not->toBeNull()
    ->and($turfData2['user_permissions']['role_in_turf'])->toBe('player')
    ->and($turfData2['user_permissions']['can_invite_players'])->toBe(false);
});
