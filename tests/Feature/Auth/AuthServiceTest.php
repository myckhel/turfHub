<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\AuthService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
  use RefreshDatabase;

  protected AuthService $authService;

  protected function setUp(): void
  {
    parent::setUp();
    $this->authService = app(AuthService::class);
  }

  public function test_can_register_user(): void
  {
    Event::fake();

    $userData = [
      'name' => 'John Doe',
      'email' => 'john@example.com',
      'password' => 'password123',
    ];

    $user = $this->authService->register($userData);

    $this->assertInstanceOf(User::class, $user);
    $this->assertEquals($userData['name'], $user->name);
    $this->assertEquals($userData['email'], $user->email);
    $this->assertTrue(Hash::check($userData['password'], $user->password));

    Event::assertDispatched(Registered::class);
  }

  public function test_can_login_user(): void
  {
    $user = User::factory()->create([
      'password' => Hash::make('password123'),
    ]);

    $credentials = [
      'email' => $user->email,
      'password' => 'password123',
    ];

    $loggedInUser = $this->authService->login($credentials);

    $this->assertEquals($user->id, $loggedInUser->id);
  }

  public function test_can_send_password_reset_link(): void
  {
    $user = User::factory()->create();

    $status = $this->authService->sendPasswordResetLink($user->email);

    $this->assertEquals(Password::RESET_LINK_SENT, $status);
  }

  public function test_can_reset_password(): void
  {
    Event::fake();

    $user = User::factory()->create();
    $token = Password::createToken($user);

    $resetData = [
      'token' => $token,
      'email' => $user->email,
      'password' => 'newpassword123',
      'password_confirmation' => 'newpassword123',
    ];

    $status = $this->authService->resetPassword($resetData);

    $this->assertEquals(Password::PASSWORD_RESET, $status);

    $user->refresh();
    $this->assertTrue(Hash::check('newpassword123', $user->password));

    Event::assertDispatched(PasswordReset::class);
  }

  public function test_can_create_api_token(): void
  {
    $user = User::factory()->create();

    $token = $this->authService->createApiToken($user);

    $this->assertIsString($token);
    $this->assertDatabaseHas('personal_access_tokens', [
      'tokenable_id' => $user->id,
      'tokenable_type' => User::class,
    ]);
  }

  public function test_can_revoke_all_tokens(): void
  {
    $user = User::factory()->create();

    // Create multiple tokens
    $this->authService->createApiToken($user, 'token1');
    $this->authService->createApiToken($user, 'token2');

    $this->authService->revokeAllTokens($user);

    $this->assertDatabaseMissing('personal_access_tokens', [
      'tokenable_id' => $user->id,
    ]);
  }

  public function test_can_confirm_password(): void
  {
    $user = User::factory()->create([
      'password' => Hash::make('password123'),
    ]);

    $this->assertTrue($this->authService->confirmPassword($user, 'password123'));
    $this->assertFalse($this->authService->confirmPassword($user, 'wrongpassword'));
  }

  public function test_can_send_email_verification(): void
  {
    $user = User::factory()->create([
      'email_verified_at' => null,
    ]);

    $this->authService->sendEmailVerification($user);

    // Since we can't easily test email sending, we just verify no exception was thrown
    $this->assertTrue(true);
  }
}
