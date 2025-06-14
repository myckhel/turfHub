<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\User;
use App\Models\MatchSession;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 100, 5000);

        // Randomly choose a payable model
        $payableTypes = [
            MatchSession::class,
            Team::class,
        ];

        $payableType = $this->faker->randomElement($payableTypes);
        $payable = $payableType::factory();

        return [
            'user_id' => User::factory(),
            'payable_type' => $payableType,
            'payable_id' => $payable,
            'reference' => 'TURF_' . strtoupper(Str::random(10)) . '_' . time() . $this->faker->unique()->randomNumber(3),
            'paystack_reference' => $this->faker->boolean(80) ? 'ps_' . Str::random(20) : null,
            'amount' => $amount,
            'currency' => 'NGN',
            'status' => $this->faker->randomElement([
                Payment::STATUS_PENDING,
                Payment::STATUS_SUCCESS,
                Payment::STATUS_FAILED,
                Payment::STATUS_CANCELLED,
            ]),
            'payment_method' => $this->faker->randomElement(['card', 'bank_transfer', 'ussd', 'qr']),
            'gateway_response' => $this->faker->sentence(),
            'paid_at' => $this->faker->boolean(70) ? $this->faker->dateTimeBetween('-1 month', 'now') : null,
            'metadata' => [
                'payment_channel' => $this->faker->randomElement(['web', 'mobile', 'api']),
                'user_agent' => $this->faker->userAgent(),
                'ip_address' => $this->faker->ipv4(),
            ],
            'payment_type' => $this->faker->randomElement([
                Payment::TYPE_SESSION_FEE,
                Payment::TYPE_TEAM_JOINING_FEE,
                Payment::TYPE_TURF_BOOKING,
                Payment::TYPE_MEMBERSHIP_FEE,
            ]),
            'description' => $this->faker->sentence(),
        ];
    }

    /**
     * Indicate that the payment is successful.
     */
    public function successful(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => Payment::STATUS_SUCCESS,
            'paid_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'gateway_response' => 'Payment successful',
            'paystack_reference' => 'ps_' . Str::random(20),
        ]);
    }

    /**
     * Indicate that the payment is pending.
     */
    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => Payment::STATUS_PENDING,
            'paid_at' => null,
            'gateway_response' => null,
        ]);
    }

    /**
     * Indicate that the payment has failed.
     */
    public function failed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => Payment::STATUS_FAILED,
            'paid_at' => null,
            'gateway_response' => 'Payment failed - Insufficient funds',
        ]);
    }

    /**
     * Indicate that the payment was cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => Payment::STATUS_CANCELLED,
            'paid_at' => null,
            'gateway_response' => 'Payment cancelled by user',
        ]);
    }

    /**
     * Create a payment for session fee.
     */
    public function sessionFee(): static
    {
        return $this->state(fn(array $attributes) => [
            'payable_type' => MatchSession::class,
            'payable_id' => MatchSession::factory(),
            'payment_type' => Payment::TYPE_SESSION_FEE,
            'amount' => $this->faker->randomFloat(2, 800, 1500),
            'description' => 'Session participation fee',
        ]);
    }

    /**
     * Create a payment for team joining fee.
     */
    public function teamJoiningFee(): static
    {
        return $this->state(fn(array $attributes) => [
            'payable_type' => Team::class,
            'payable_id' => Team::factory(),
            'payment_type' => Payment::TYPE_TEAM_JOINING_FEE,
            'amount' => $this->faker->randomFloat(2, 300, 800),
            'description' => 'Team joining fee',
        ]);
    }

    /**
     * Create a payment for turf booking.
     */
    public function turfBooking(): static
    {
        return $this->state(fn(array $attributes) => [
            'payable_type' => \App\Models\Turf::class,
            'payable_id' => \App\Models\Turf::factory(),
            'payment_type' => Payment::TYPE_TURF_BOOKING,
            'amount' => $this->faker->randomFloat(2, 2000, 8000),
            'description' => 'Turf booking fee',
        ]);
    }

    /**
     * Create a payment for a specific payable model.
     */
    public function forPayable($payable): static
    {
        return $this->state(fn(array $attributes) => [
            'payable_type' => get_class($payable),
            'payable_id' => $payable->id,
        ]);
    }
}
