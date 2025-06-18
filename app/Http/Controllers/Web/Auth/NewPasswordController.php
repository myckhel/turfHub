<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
  protected AuthService $authService;

  public function __construct(AuthService $authService)
  {
    $this->authService = $authService;
  }

  /**
   * Show the password reset page.
   */
  public function create(Request $request): Response
  {
    return Inertia::render('auth/reset-password', [
      'email' => $request->email,
      'token' => $request->route('token'),
    ]);
  }

  /**
   * Handle an incoming new password request.
   */
  public function store(ResetPasswordRequest $request): RedirectResponse
  {
    $this->authService->resetPassword($request->validated());

    return to_route('login')->with('status', __('Password reset successfully.'));
  }
}
