<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
  protected AuthService $authService;

  public function __construct(AuthService $authService)
  {
    $this->authService = $authService;
  }

  /**
   * Send a new email verification notification.
   */
  public function store(Request $request): RedirectResponse
  {
    if ($request->user()->hasVerifiedEmail()) {
      return redirect()->intended(route('dashboard', absolute: false));
    }

    $this->authService->sendEmailVerification($request->user());

    return back()->with('status', 'verification-link-sent');
  }
}
