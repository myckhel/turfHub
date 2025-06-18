<?php

namespace App\Http\Controllers\Web\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
  protected AuthService $authService;

  public function __construct(AuthService $authService)
  {
    $this->authService = $authService;
  }

  /**
   * Show the password reset link request page.
   */
  public function create(Request $request): Response
  {
    return Inertia::render('auth/forgot-password', [
      'status' => $request->session()->get('status'),
    ]);
  }

  /**
   * Handle an incoming password reset link request.
   */
  public function store(ForgotPasswordRequest $request): RedirectResponse
  {
    $this->authService->sendPasswordResetLink($request->validated()['email']);

    return back()->with('status', __('A reset link will be sent if the account exists.'));
  }
}
