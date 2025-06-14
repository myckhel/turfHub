<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Paystack webhook event listener
        \Illuminate\Support\Facades\Event::listen(
            \Binkode\Paystack\Events\Hook::class,
            \App\Listeners\PaystackWebHookListener::class
        );
    }
}
