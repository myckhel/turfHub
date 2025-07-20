<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    if ($this->app->environment('local') && class_exists(\Laravel\Telescope\TelescopeServiceProvider::class)) {
      $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
      $this->app->register(\App\Providers\TelescopeServiceProvider::class);
    }
  }

  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    JsonResource::withoutWrapping();
    // Register Paystack webhook event listener
    \Illuminate\Support\Facades\Event::listen(
      \Binkode\Paystack\Events\Hook::class,
      \App\Listeners\PaystackWebHookListener::class
    );
  }
}
