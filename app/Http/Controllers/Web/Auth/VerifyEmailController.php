<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
  protected AuthService $authService;

  public function __construct(AuthService $authService)
  {
    $this->authService = $authService;
  }

  /**
   * Mark the authenticated user's email address as verified.
   */
  public function __invoke(EmailVerificationRequest $request): RedirectResponse
  {
    if ($request->user()->hasVerifiedEmail()) {
      return redirect()->intended(route('dashboard', absolute: false) . '?verified=1');
    }

    $this->authService->verifyEmail($request->user(), $request);

    return redirect()->intended(route('dashboard', absolute: false) . '?verified=1');
  }
}
