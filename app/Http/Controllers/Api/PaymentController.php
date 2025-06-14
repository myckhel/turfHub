<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InitializePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\MatchSession;
use App\Models\Team;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Initialize payment with Paystack.
     */
    public function initialize(InitializePaymentRequest $request): JsonResponse
    {
        $matchSession = MatchSession::findOrFail($request->match_session_id);
        $team = $request->team_id ? Team::findOrFail($request->team_id) : null;

        $result = $this->paymentService->initializeSessionPayment(
            user: $request->user(),
            matchSession: $matchSession,
            amount: $request->amount,
            team: $team,
            paymentType: $request->payment_type ?? Payment::TYPE_SESSION_FEE
        );

        if (!$result['status']) {
            return response()->json([
                'status' => false,
                'message' => $result['message'],
            ], 400);
        }

        return response()->json([
            'status' => true,
            'message' => 'Payment initialized successfully',
            'data' => $result['data'],
        ]);
    }

    /**
     * Verify payment with Paystack.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'reference' => 'required|string',
        ]);

        $result = $this->paymentService->verifyPayment($request->reference);

        if (!$result['status']) {
            return response()->json([
                'status' => false,
                'message' => $result['message'],
            ], 400);
        }

        return response()->json([
            'status' => true,
            'message' => 'Payment verification completed',
            'data' => [
                'payment' => new PaymentResource($result['data']['payment']),
                'transaction_data' => $result['data']['transaction_data'],
            ],
        ]);
    }

    /**
     * Get user's payment history.
     */
    public function history(Request $request): JsonResponse
    {
        $limit = $request->query('limit', 10);
        $paymentHistory = $this->paymentService->getUserPaymentHistory($request->user(), $limit);

        return response()->json([
            'status' => true,
            'data' => [
                'payments' => PaymentResource::collection($paymentHistory['payments']),
                'total_amount' => $paymentHistory['total_amount'],
                'successful_payments' => $paymentHistory['successful_payments'],
            ],
        ]);
    }

    /**
     * Get a specific payment.
     */
    public function show(Payment $payment): JsonResponse
    {
        $this->authorize('view', $payment);

        $payment->load(['matchSession.turf', 'team', 'user']);

        return response()->json([
            'status' => true,
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * Get payment statistics for a match session.
     */
    public function matchSessionStats(MatchSession $matchSession): JsonResponse
    {
        $stats = $this->paymentService->getMatchSessionPaymentStats($matchSession);

        return response()->json([
            'status' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Cancel a pending payment.
     */
    public function cancel(Payment $payment): JsonResponse
    {
        $this->authorize('update', $payment);

        if (!$payment->isPending()) {
            return response()->json([
                'status' => false,
                'message' => 'Payment cannot be cancelled',
            ], 400);
        }

        if ($this->paymentService->cancelPayment($payment)) {
            return response()->json([
                'status' => true,
                'message' => 'Payment cancelled successfully',
                'data' => new PaymentResource($payment->fresh()),
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Failed to cancel payment',
        ], 400);
    }

    /**
     * Get suggested payment amount for a match session.
     */
    public function suggestedAmount(Request $request): JsonResponse
    {
        $request->validate([
            'match_session_id' => 'required|exists:match_sessions,id',
            'payment_type' => 'required|in:' . Payment::TYPE_SESSION_FEE . ',' . Payment::TYPE_TEAM_JOINING_FEE,
        ]);

        $matchSession = MatchSession::findOrFail($request->match_session_id);
        $amount = $this->paymentService->getSuggestedPaymentAmount($matchSession, $request->payment_type);

        return response()->json([
            'status' => true,
            'data' => [
                'suggested_amount' => $amount,
                'currency' => 'NGN',
                'payment_type' => $request->payment_type,
            ],
        ]);
    }
}
