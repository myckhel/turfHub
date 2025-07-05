<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class WalletBalanceValidation
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    // Get the amount from request
    $amount = $request->input('amount');

    // Get the user from request
    $user = $request->user();

    if (!$user) {
      return response()->json([
        'error' => 'Unauthorized',
        'message' => 'User not authenticated'
      ], 401);
    }

    // Check if amount is valid
    if (!$amount || $amount <= 0) {
      return response()->json([
        'error' => 'Invalid Amount',
        'message' => 'Amount must be greater than zero'
      ], 422);
    }

    // Check if user has sufficient wallet balance
    $wallet = $user->wallet;
    if (!$wallet || $wallet->balance < $amount) {
      return response()->json([
        'error' => 'Insufficient Balance',
        'message' => 'Your wallet balance is insufficient for this transaction',
        'current_balance' => $wallet ? $wallet->balanceFloat : 0,
        'required_amount' => (float) $amount
      ], 422);
    }

    return $next($request);
  }
}
