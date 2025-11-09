<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\MatchSession;
use App\Models\Turf;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PaymentService $paymentService;
    protected User $user;
    protected MatchSession $matchSession;

    protected function setUp(): void
    {
        parent::setUp();

        $this->paymentService = app(PaymentService::class);

        // Create test user
        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'name' => 'Test User'
        ]);

        // Create test turf
        $turf = Turf::factory()->create([
            'name' => 'Test Turf',
            'owner_id' => $this->user->id
        ]);

        // Create test match session
        $this->matchSession = MatchSession::factory()->create([
            'turf_id' => $turf->id,
            'name' => 'Test Match Session',
            'session_date' => now()->addDays(1),
            'start_time' => '09:00',
            'end_time' => '11:00',
            'time_slot' => 'morning'
        ]);
    }

    /** @test */
    public function it_can_get_suggested_payment_amount()
    {
        $sessionFeeAmount = $this->paymentService->getSuggestedPaymentAmount(
            $this->matchSession,
            Payment::TYPE_SESSION_FEE
        );

        $teamJoiningFeeAmount = $this->paymentService->getSuggestedPaymentAmount(
            $this->matchSession,
            Payment::TYPE_TEAM_JOINING_FEE
        );

        $this->assertEquals(1000.00, $sessionFeeAmount);
        $this->assertEquals(500.00, $teamJoiningFeeAmount);
    }

    /** @test */
    public function it_can_get_user_payment_history()
    {
        // Create some test payments
        Payment::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'payable_type' => \App\Models\MatchSession::class,
            'payable_id' => $this->matchSession->id,
            'status' => Payment::STATUS_SUCCESS,
            'amount' => 1000.00
        ]);

        Payment::factory()->create([
            'user_id' => $this->user->id,
            'payable_type' => \App\Models\MatchSession::class,
            'payable_id' => $this->matchSession->id,
            'status' => Payment::STATUS_PENDING,
            'amount' => 500.00
        ]);

        $history = $this->paymentService->getUserPaymentHistory($this->user);

        $this->assertCount(4, $history['payments']);
        $this->assertEquals(3000.00, $history['total_amount']);
        $this->assertEquals(3, $history['successful_payments']);
    }

    /** @test */
    public function it_can_get_match_session_payment_stats()
    {
        // Create payments for the match session
        Payment::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'payable_type' => \App\Models\MatchSession::class,
            'payable_id' => $this->matchSession->id,
            'status' => Payment::STATUS_SUCCESS,
            'amount' => 1000.00
        ]);

        Payment::factory()->create([
            'user_id' => $this->user->id,
            'payable_type' => \App\Models\MatchSession::class,
            'payable_id' => $this->matchSession->id,
            'status' => Payment::STATUS_PENDING,
            'amount' => 500.00
        ]);

        Payment::factory()->create([
            'user_id' => $this->user->id,
            'payable_type' => \App\Models\MatchSession::class,
            'payable_id' => $this->matchSession->id,
            'status' => Payment::STATUS_FAILED,
            'amount' => 750.00
        ]);

        $stats = $this->paymentService->getMatchSessionPaymentStats($this->matchSession);

        $this->assertEquals(4, $stats['total_payments']);
        $this->assertEquals(2, $stats['successful_payments']);
        $this->assertEquals(1, $stats['pending_payments']);
        $this->assertEquals(1, $stats['failed_payments']);
        $this->assertEquals(2000.00, $stats['total_amount_collected']);
        $this->assertEquals(500.00, $stats['total_amount_pending']);
    }

    /** @test */
    public function it_can_cancel_pending_payment()
    {
        $payment = Payment::factory()->create([
            'user_id' => $this->user->id,
            'payable_type' => \App\Models\MatchSession::class,
            'payable_id' => $this->matchSession->id,
            'status' => Payment::STATUS_PENDING,
            'amount' => 1000.00
        ]);

        $result = $this->paymentService->cancelPayment($payment);

        $this->assertTrue($result);
        $this->assertEquals(Payment::STATUS_CANCELLED, $payment->fresh()->status);
    }

    /** @test */
    public function it_cannot_cancel_successful_payment()
    {
        $payment = Payment::factory()->create([
            'user_id' => $this->user->id,
            'payable_type' => \App\Models\MatchSession::class,
            'payable_id' => $this->matchSession->id,
            'status' => Payment::STATUS_SUCCESS,
            'amount' => 1000.00
        ]);

        $result = $this->paymentService->cancelPayment($payment);

        $this->assertFalse($result);
        $this->assertEquals(Payment::STATUS_SUCCESS, $payment->fresh()->status);
    }
}
