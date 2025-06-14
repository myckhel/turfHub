<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\InitializePaymentRequest;
use App\Models\MatchSession;
use App\Models\Team;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Display payment initialization page.
     */
    public function create(Request $request): Response
    {
        $matchSession = MatchSession::with('turf')->findOrFail($request->match_session_id);
        $team = $request->team_id ? Team::findOrFail($request->team_id) : null;
        $paymentType = $request->payment_type ?? Payment::TYPE_SESSION_FEE;

        $suggestedAmount = $this->paymentService->getSuggestedPaymentAmount($matchSession, $paymentType);

        return Inertia::render('Payment/Create', [
            'matchSession' => $matchSession,
            'team' => $team,
            'paymentType' => $paymentType,
            'suggestedAmount' => $suggestedAmount,
            'paymentTypes' => [
                Payment::TYPE_SESSION_FEE => 'Session Participation Fee',
                Payment::TYPE_TEAM_JOINING_FEE => 'Team Joining Fee',
            ],
        ]);
    }

    /**
     * Initialize payment with Paystack.
     */
    public function initialize(InitializePaymentRequest $request): RedirectResponse
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
            return back()->withErrors(['payment' => $result['message']]);
        }

        // Redirect to Paystack payment page
        return redirect()->away($result['data']['authorization_url']);
    }

    /**
     * Handle payment callback from Paystack.
     */
    public function callback(Request $request): RedirectResponse
    {
        $reference = $request->reference;

        if (!$reference) {
            return redirect()->route('dashboard')->withErrors(['payment' => 'Invalid payment reference']);
        }

        $result = $this->paymentService->verifyPayment($reference);

        if (!$result['status']) {
            return redirect()->route('dashboard')->withErrors(['payment' => $result['message']]);
        }

        $payment = $result['data']['payment'];

        if ($payment->isSuccessful()) {
            return redirect()->route('payment.success', $payment)
                ->with('success', 'Payment successful! You can now participate in the match session.');
        } else {
            return redirect()->route('payment.failed', $payment)
                ->withErrors(['payment' => 'Payment was not successful. Please try again.']);
        }
    }

    /**
     * Display payment success page.
     */
    public function success(Payment $payment): Response
    {
        $this->authorize('view', $payment);

        $payment->load(['matchSession.turf', 'team']);

        return Inertia::render('Payment/Success', [
            'payment' => $payment,
        ]);
    }

    /**
     * Display payment failed page.
     */
    public function failed(Payment $payment): Response
    {
        $this->authorize('view', $payment);

        $payment->load(['matchSession.turf', 'team']);

        return Inertia::render('Payment/Failed', [
            'payment' => $payment,
        ]);
    }

    /**
     * Display user's payment history.
     */
    public function history(Request $request): Response
    {
        $paymentHistory = $this->paymentService->getUserPaymentHistory($request->user());

        return Inertia::render('Payment/History', [
            'paymentHistory' => $paymentHistory,
        ]);
    }

    /**
     * Verify a specific payment.
     */
    public function verify(Payment $payment): RedirectResponse
    {
        $this->authorize('view', $payment);

        if (!$payment->isPending()) {
            return back()->withErrors(['payment' => 'Payment is not in pending state']);
        }

        $result = $this->paymentService->verifyPayment($payment->reference);

        if (!$result['status']) {
            return back()->withErrors(['payment' => $result['message']]);
        }

        return back()->with('success', 'Payment verification completed');
    }

    /**
     * Cancel a pending payment.
     */
    public function cancel(Payment $payment): RedirectResponse
    {
        $this->authorize('update', $payment);

        if (!$payment->isPending()) {
            return back()->withErrors(['payment' => 'Payment cannot be cancelled']);
        }

        if ($this->paymentService->cancelPayment($payment)) {
            return back()->with('success', 'Payment cancelled successfully');
        }

        return back()->withErrors(['payment' => 'Failed to cancel payment']);
    }
}
