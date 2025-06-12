<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

describe('Authentication API', function () {
    describe('Registration', function () {
        it('can register a new user', function () {
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
                        'role',
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

        it('validates registration data', function () {
            $response = $this->postJson('/api/auth/register', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['name', 'email', 'password']);
        });

        it('prevents duplicate email registration', function () {
            User::factory()->create(['email' => 'existing@example.com']);

            $userData = [
                'name' => 'John Doe',
                'email' => 'existing@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ];

            $response = $this->postJson('/api/auth/register', $userData);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
        });

        it('validates password confirmation', function () {
            $userData = [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'password_confirmation' => 'different',
            ];

            $response = $this->postJson('/api/auth/register', $userData);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['password']);
        });
    });

    describe('Login', function () {
        it('can login with valid credentials', function () {
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
                        'role',
                    ],
                    'token',
                ]);
        });

        it('rejects invalid credentials', function () {
            User::factory()->create([
                'email' => 'john@example.com',
                'password' => bcrypt('password123'),
            ]);

            $loginData = [
                'email' => 'john@example.com',
                'password' => 'wrongpassword',
            ];

            $response = $this->postJson('/api/auth/login', $loginData);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
        });

        it('validates login data', function () {
            $response = $this->postJson('/api/auth/login', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['email', 'password']);
        });
    });

    describe('Protected Routes', function () {
        it('can access user data when authenticated', function () {
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

        it('rejects unauthenticated requests', function () {
            $response = $this->getJson('/api/auth/user');

            $response->assertStatus(401);
        });

        it('can logout successfully', function () {
            $user = User::factory()->create();
            Sanctum::actingAs($user);

            $response = $this->postJson('/api/auth/logout');

            $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Logged out successfully',
                ]);
        });

        it('can logout from all devices', function () {
            $user = User::factory()->create();

            // Create multiple tokens
            $token1 = $user->createToken('device1')->plainTextToken;
            $token2 = $user->createToken('device2')->plainTextToken;

            Sanctum::actingAs($user);

            expect($user->tokens)->toHaveCount(2);

            $response = $this->postJson('/api/auth/logout-all');

            $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Logged out from all devices successfully',
                ]);

            $user->refresh();
            expect($user->tokens)->toHaveCount(0);
        });
    });

    describe('Token Authentication', function () {
        it('can authenticate with API token', function () {
            $user = User::factory()->create();
            $token = $user->createToken('test-token')->plainTextToken;

            $response = $this->withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->getJson('/api/auth/user');

            $response->assertStatus(200)
                ->assertJson([
                    'data' => [
                        'id' => $user->id,
                        'email' => $user->email,
                    ],
                ]);
        });

        it('rejects invalid tokens', function () {
            $response = $this->withHeaders([
                'Authorization' => 'Bearer invalid-token',
            ])->getJson('/api/auth/user');

            $response->assertStatus(401);
        });

        it('rejects expired tokens', function () {
            $user = User::factory()->create();
            $token = $user->createToken('test-token', ['*'], now()->subHour())->plainTextToken;

            $response = $this->withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->getJson('/api/auth/user');

            $response->assertStatus(401);
        });
    });
});
