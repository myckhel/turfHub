<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
  /**
   * Register a new user
   */
  public function register(array $data): User
  {
    $user = User::create([
      'name' => $data['name'],
      'email' => $data['email'],
      'password' => Hash::make($data['password']),
    ]);

    event(new Registered($user));

    return $user;
  }

  /**
   * Authenticate user and return user instance
   */
  public function login(array $credentials): User
  {
    if (!Auth::attempt($credentials)) {
      throw ValidationException::withMessages([
        'email' => ['The provided credentials are incorrect.'],
      ]);
    }

    return Auth::user();
  }

  /**
   * Send password reset link
   */
  public function sendPasswordResetLink(string $email): string
  {
    $status = Password::sendResetLink(['email' => $email]);

    if ($status !== Password::RESET_LINK_SENT) {
      throw ValidationException::withMessages([
        'email' => [__($status)],
      ]);
    }

    return $status;
  }

  /**
   * Reset password using token
   */
  public function resetPassword(array $data): string
  {
    $status = Password::reset(
      $data,
      function (User $user, string $password) {
        $user->forceFill([
          'password' => Hash::make($password)
        ])->setRememberToken(Str::random(60));

        $user->save();

        event(new PasswordReset($user));
      }
    );

    if ($status !== Password::PASSWORD_RESET) {
      throw ValidationException::withMessages([
        'email' => [__($status)],
      ]);
    }

    return $status;
  }

  /**
   * Send email verification notification
   */
  public function sendEmailVerification(User $user): void
  {
    if ($user->hasVerifiedEmail()) {
      throw ValidationException::withMessages([
        'email' => ['Email is already verified.'],
      ]);
    }

    $user->sendEmailVerificationNotification();
  }

  /**
   * Verify email using verification URL
   */
  public function verifyEmail(User $user, Request $request): bool
  {
    if (!$request->hasValidSignature()) {
      throw ValidationException::withMessages([
        'signature' => ['Invalid verification link.'],
      ]);
    }

    if ($user->hasVerifiedEmail()) {
      return true;
    }

    if ($user->markEmailAsVerified()) {
      event(new Verified($user));
      return true;
    }

    return false;
  }

  /**
   * Create API token for user
   */
  public function createApiToken(User $user, string $name = 'auth-token'): string
  {
    // Revoke existing tokens to ensure only one active session per user
    $user->tokens()->delete();

    return $user->createToken($name)->plainTextToken;
  }

  /**
   * Revoke specific token
   */
  public function revokeToken(User $user, int $tokenId = null): void
  {
    if ($tokenId) {
      $user->tokens()->where('id', $tokenId)->delete();
    } else {
      // Revoke the current access token
      if ($user->currentAccessToken()) {
        $user->currentAccessToken()->delete();
      }
    }
  }

  /**
   * Revoke all tokens for user
   */
  public function revokeAllTokens(User $user): void
  {
    $user->tokens()->delete();
  }

  /**
   * Check if password confirmation is valid
   */
  public function confirmPassword(User $user, string $password): bool
  {
    return Hash::check($password, $user->password);
  }
}
