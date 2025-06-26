<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Turf;
use App\Services\TurfService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TeamSlotFeeTest extends TestCase
{
  use RefreshDatabase;

  protected User $user;
  protected Turf $turf;
  protected TurfService $turfService;

  protected function setUp(): void
  {
    parent::setUp();

    $this->user = User::factory()->create();
    $this->turf = Turf::factory()->create([
      'team_slot_fee' => 25.00,
      'requires_membership' => false,
    ]);
    $this->turfService = app(TurfService::class);
  }

  public function test_turf_requires_team_slot_fee(): void
  {
    $this->assertTrue($this->turf->requiresTeamSlotFee());
    $this->assertEquals(25.00, $this->turf->getTeamSlotFee());
  }

  public function test_turf_without_team_slot_fee(): void
  {
    $freeTurf = Turf::factory()->create([
      'team_slot_fee' => null,
    ]);

    $this->assertFalse($freeTurf->requiresTeamSlotFee());
    $this->assertNull($freeTurf->getTeamSlotFee());
  }

  public function test_calculate_team_join_cost(): void
  {
    $cost = $this->turfService->calculateTeamJoinCost($this->turf, false);
    $this->assertEquals(25.00, $cost);
  }

  public function test_calculate_team_join_cost_with_membership(): void
  {
    $membershipTurf = Turf::factory()->create([
      'team_slot_fee' => 25.00,
      'requires_membership' => true,
      'membership_fee' => 50.00,
    ]);

    // Non-member should pay both fees
    $cost = $this->turfService->calculateTeamJoinCost($membershipTurf, false);
    $this->assertEquals(75.00, $cost);

    // Member should only pay team slot fee
    $cost = $this->turfService->calculateTeamJoinCost($membershipTurf, true);
    $this->assertEquals(25.00, $cost);
  }

  public function test_get_join_cost_breakdown(): void
  {
    $breakdown = $this->turfService->getJoinCostBreakdown($this->turf, $this->user);

    $this->assertTrue($breakdown['requires_payment']);
    $this->assertEquals(25.00, $breakdown['total']);
    $this->assertEquals(25.00, $breakdown['team_slot_fee']);
    $this->assertEquals(0, $breakdown['membership_fee']);
    $this->assertCount(1, $breakdown['breakdown_details']);
  }

  public function test_get_team_slot_fee_info(): void
  {
    $feeInfo = $this->turfService->getTeamSlotFeeInfo($this->turf);

    $this->assertTrue($feeInfo['has_team_slot_fee']);
    $this->assertEquals(25.00, $feeInfo['team_slot_fee']);
    $this->assertEquals('25.00', $feeInfo['formatted_fee']);
  }

  public function test_process_team_slot_payment(): void
  {
    $result = $this->turfService->processTeamSlotPayment($this->user, $this->turf);

    $this->assertTrue($result['success']);
    $this->assertEquals(25.00, $result['amount_charged']);
    $this->assertStringContainsString('successful', $result['message']);
  }

  public function test_process_payment_for_free_turf(): void
  {
    $freeTurf = Turf::factory()->create([
      'team_slot_fee' => null,
    ]);

    $result = $this->turfService->processTeamSlotPayment($this->user, $freeTurf);

    $this->assertTrue($result['success']);
    $this->assertEquals(0, $result['amount_charged']);
    $this->assertStringContainsString('No payment required', $result['message']);
  }
}
