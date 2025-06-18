<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\EmailVerificationRequest;
use App\Http\Resources\Auth\AuthUserResource;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
  protected AuthService $authService;

  public function __construct(AuthService $authService)
  {
    $this->authService = $authService;
  }

  /**
   * Register a new user and return API token
   */
  public function register(RegisterRequest $request): JsonResponse
  {
    $user = $this->authService->register($request->validated());
    $token = $this->authService->createApiToken($user);

    return response()->json([
      'message' => 'User registered successfully',
      'user' => new AuthUserResource($user),
      'token' => $token,
    ], 201);
  }

  /**
   * Login user and return API token
   */
  public function login(LoginRequest $request): JsonResponse
  {
    $user = $this->authService->login($request->validated());
    $token = $this->authService->createApiToken($user);

    return response()->json([
      'message' => 'Login successful',
      'user' => new AuthUserResource($user),
      'token' => $token,
    ]);
  }

  /**
   * Send password reset link
   */
  public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
  {
    $this->authService->sendPasswordResetLink($request->validated()['email']);

    return response()->json([
      'message' => 'Password reset link sent to your email address.',
    ]);
  }

  /**
   * Reset password using token
   */
  public function resetPassword(ResetPasswordRequest $request): JsonResponse
  {
    $this->authService->resetPassword($request->validated());

    return response()->json([
      'message' => 'Password has been reset successfully.',
    ]);
  }

  /**
   * Send email verification notification
   */
  public function sendEmailVerification(Request $request): JsonResponse
  {
    $this->authService->sendEmailVerification($request->user());

    return response()->json([
      'message' => 'Verification email sent.',
    ]);
  }

  /**
   * Verify email address
   */
  public function verifyEmail(EmailVerificationRequest $request, string $id, string $hash): JsonResponse
  {
    $user = User::findOrFail($id);

    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
      return response()->json([
        'message' => 'Invalid verification link.',
      ], 400);
    }

    $this->authService->verifyEmail($user, $request);

    return response()->json([
      'message' => 'Email verified successfully.',
    ]);
  }

  /**
   * Logout user (revoke current token)
   */
  public function logout(Request $request): JsonResponse
  {
    $this->authService->revokeToken($request->user());

    return response()->json([
      'message' => 'Logged out successfully',
    ]);
  }

  /**
   * Logout from all devices (revoke all tokens)
   */
  public function logoutAll(Request $request): JsonResponse
  {
    $this->authService->revokeAllTokens($request->user());

    return response()->json([
      'message' => 'Logged out from all devices successfully',
    ]);
  }

  /**
   * Get authenticated user
   */
  public function user(Request $request): AuthUserResource
  {
    return new AuthUserResource($request->user());
  }

  /**
   * Get CSRF cookie for SPA authentication
   */
  public function sanctumCsrfCookie(): JsonResponse
  {
    return response()->json(['message' => 'CSRF cookie set']);
  }

  /**
   * Confirm user password
   */
  public function confirmPassword(Request $request): JsonResponse
  {
    $request->validate([
      'password' => ['required', 'string'],
    ]);

    if (!$this->authService->confirmPassword($request->user(), $request->password)) {
      return response()->json([
        'message' => 'The provided password is incorrect.',
      ], 422);
    }

    return response()->json([
      'message' => 'Password confirmed.',
    ]);
  }
}
