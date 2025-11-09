<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
  use RefreshDatabase;

  public function test_user_can_register_via_api(): void
  {
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
          'email_verified_at',
          'created_at',
          'updated_at',
        ],
        'token',
      ]);

    $this->assertDatabaseHas('users', [
      'email' => $userData['email'],
      'name' => $userData['name'],
    ]);
  }

  public function test_user_can_login_via_api(): void
  {
    $user = User::factory()->create([
      'password' => Hash::make('password123'),
    ]);

    $loginData = [
      'email' => $user->email,
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
  }

  public function test_user_can_request_password_reset_via_api(): void
  {
    $user = User::factory()->create();

    $response = $this->postJson('/api/auth/forgot-password', [
      'email' => $user->email,
    ]);

    $response->assertStatus(200)
      ->assertJson([
        'message' => 'Password reset link sent to your email address.',
      ]);
  }

  public function test_user_can_reset_password_via_api(): void
  {
    $user = User::factory()->create();
    $token = Password::createToken($user);

    $resetData = [
      'token' => $token,
      'email' => $user->email,
      'password' => 'newpassword123',
      'password_confirmation' => 'newpassword123',
    ];

    $response = $this->postJson('/api/auth/reset-password', $resetData);

    $response->assertStatus(200)
      ->assertJson([
        'message' => 'Password has been reset successfully.',
      ]);

    $user->refresh();
    $this->assertTrue(Hash::check('newpassword123', $user->password));
  }

  public function test_authenticated_user_can_get_profile_via_api(): void
  {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->getJson('/api/auth/user', [
      'Authorization' => 'Bearer ' . $token,
    ]);

    $response->assertStatus(200)
      ->assertJsonStructure([
        'id',
        'name',
        'email',
        'email_verified_at',
        'created_at',
        'updated_at',
      ]);
  }

  public function test_authenticated_user_can_logout_via_api(): void
  {
    $user = User::factory()->create();
    $tokenModel = $user->createToken('test-token');
    $token = $tokenModel->plainTextToken;

    $response = $this->postJson('/api/auth/logout', [], [
      'Authorization' => 'Bearer ' . $token,
    ]);

    $response->assertStatus(200)
      ->assertJson([
        'message' => 'Logged out successfully',
      ]);

    // Check that the token was actually deleted
    $this->assertDatabaseMissing('personal_access_tokens', [
      'id' => $tokenModel->accessToken->id,
    ]);
  }

  public function test_authenticated_user_can_send_email_verification_via_api(): void
  {
    $user = User::factory()->create(['email_verified_at' => null]);
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->postJson('/api/auth/email/verification-notification', [], [
      'Authorization' => 'Bearer ' . $token,
    ]);

    $response->assertStatus(200)
      ->assertJson([
        'message' => 'Verification email sent.',
      ]);
  }

  public function test_authenticated_user_can_confirm_password_via_api(): void
  {
    $user = User::factory()->create([
      'password' => Hash::make('password123'),
    ]);
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->postJson('/api/auth/confirm-password', [
      'password' => 'password123',
    ], [
      'Authorization' => 'Bearer ' . $token,
    ]);

    $response->assertStatus(200)
      ->assertJson([
        'message' => 'Password confirmed.',
      ]);
  }

  public function test_password_confirmation_fails_with_wrong_password(): void
  {
    $user = User::factory()->create([
      'password' => Hash::make('password123'),
    ]);
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->postJson('/api/auth/confirm-password', [
      'password' => 'wrongpassword',
    ], [
      'Authorization' => 'Bearer ' . $token,
    ]);

    $response->assertStatus(422)
      ->assertJson([
        'message' => 'The provided password is incorrect.',
      ]);
  }
}
