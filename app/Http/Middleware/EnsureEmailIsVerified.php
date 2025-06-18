<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
  /**
   * Handle an incoming request.
   */
  public function handle(Request $request, Closure $next): Response
  {
    if (
      !$request->user() ||
      ($request->user() instanceof \Illuminate\Contracts\Auth\MustVerifyEmail &&
        !$request->user()->hasVerifiedEmail())
    ) {

      // For API requests, return JSON response
      if ($request->expectsJson()) {
        return new JsonResponse([
          'message' => 'Your email address is not verified.',
          'email_verification_required' => true,
        ], 403);
      }

      // For web requests, redirect to verification notice
      return redirect()->route('verification.notice');
    }

    return $next($request);
  }
}
