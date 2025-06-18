<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
  protected AuthService $authService;

  public function __construct(AuthService $authService)
  {
    $this->authService = $authService;
  }

  /**
   * Show the confirm password page.
   */
  public function show(): Response
  {
    return Inertia::render('auth/confirm-password');
  }

  /**
   * Confirm the user's password.
   */
  public function store(Request $request): RedirectResponse
  {
    $request->validate([
      'password' => ['required', 'string'],
    ]);

    if (!$this->authService->confirmPassword($request->user(), $request->password)) {
      throw ValidationException::withMessages([
        'password' => __('auth.password'),
      ]);
    }

    $request->session()->put('auth.password_confirmed_at', time());

    return redirect()->intended(route('dashboard', absolute: false));
  }
}
