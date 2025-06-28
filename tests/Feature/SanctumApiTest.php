<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('can register a new user via API', function () {
  $userData = [
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => 'password123',
    'password_confirmation' => 'password123',
  ];

  $response = $this->postJson('/api/auth/register', $userData);

  $response->assertStatus(201)
    ->assertJsonStructure([
      'message',
      'user' => [
        'id',
        'name',
        'email',
        'created_at',
        'updated_at',
      ],
      'token',
    ]);

  $this->assertDatabaseHas('users', [
    'email' => 'john@example.com',
    'name' => 'John Doe',
  ]);
});

test('can login with valid credentials via API', function () {
  $user = User::factory()->create([
    'email' => 'john@example.com',
    'password' => bcrypt('password123'),
  ]);

  $loginData = [
    'email' => 'john@example.com',
    'password' => 'password123',
  ];

  $response = $this->postJson('/api/auth/login', $loginData);

  $response->assertStatus(200)
    ->assertJsonStructure([
      'message',
      'user' => [
        'id',
        'name',
        'email',
      ],
      'token',
    ]);
});

test('can access protected route with token', function () {
  $user = User::factory()->create();
  Sanctum::actingAs($user);

  $response = $this->getJson('/api/auth/user');

  $response->assertStatus(200)
    ->assertJson([
      'data' => [
        'id' => $user->id,
        'email' => $user->email,
        'name' => $user->name,
      ],
    ]);
});

test('rejects unauthenticated requests', function () {
  $response = $this->getJson('/api/auth/user');

  $response->assertStatus(401);
});

test('can logout successfully', function () {
  $user = User::factory()->create();
  Sanctum::actingAs($user);

  $response = $this->postJson('/api/auth/logout');

  $response->assertStatus(200)
    ->assertJson([
      'message' => 'Logged out successfully',
    ]);
});
