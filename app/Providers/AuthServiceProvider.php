<?php

namespace App\Providers;

use App\Models\Player;
use App\Models\Team;
use App\Models\MatchSession;
use App\Models\Turf;
use App\Models\Payment;
use App\Models\Bet;
use App\Policies\PlayerPolicy;
use App\Policies\TeamPolicy;
use App\Policies\MatchSessionPolicy;
use App\Policies\TurfPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\BetPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Player::class => PlayerPolicy::class,
        Team::class => TeamPolicy::class,
        MatchSession::class => MatchSessionPolicy::class,
        Turf::class => TurfPolicy::class,
        Payment::class => PaymentPolicy::class,
        Bet::class => BetPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
