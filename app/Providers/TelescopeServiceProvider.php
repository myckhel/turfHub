<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    // Telescope::night();

    $this->hideSensitiveRequestDetails();

    $isLocal = $this->app->environment('local');

    Telescope::filter(function (IncomingEntry $entry) use ($isLocal) {
      return $isLocal ||
        $entry->isReportableException() ||
        $entry->isFailedRequest() ||
        $entry->isFailedJob() ||
        $entry->isScheduledTask() ||
        $entry->hasMonitoredTag();
    });

    // Add custom tags for TurfMate specific entries
    Telescope::tag(function (IncomingEntry $entry) {
      $tags = [];

      // Tag entries related to turf operations
      if ($entry->type === 'request') {
        $uri = $entry->content['uri'] ?? '';
        if (str_contains($uri, 'turf')) {
          $tags[] = 'turf-operations';
        }
        if (str_contains($uri, 'match-session')) {
          $tags[] = 'match-session-operations';
        }
        if (str_contains($uri, 'payment')) {
          $tags[] = 'payment-operations';
        }
        if (str_contains($uri, 'api/')) {
          $tags[] = 'api-request';
        }
      }

      // Tag queries related to specific models
      if ($entry->type === 'query') {
        $sql = $entry->content['sql'] ?? '';
        if (str_contains($sql, 'turfs')) {
          $tags[] = 'turf-queries';
        }
        if (str_contains($sql, 'match_sessions')) {
          $tags[] = 'match-session-queries';
        }
        if (str_contains($sql, 'users')) {
          $tags[] = 'user-queries';
        }
        if (str_contains($sql, 'teams')) {
          $tags[] = 'team-queries';
        }
      }

      return $tags;
    });
  }

  /**
   * Prevent sensitive request details from being logged by Telescope.
   */
  protected function hideSensitiveRequestDetails(): void
  {
    if ($this->app->environment('local')) {
      return;
    }

    Telescope::hideRequestParameters([
      '_token',
      'password',
      'password_confirmation',
      'paystack_secret_key',
      'paystack_public_key',
      'card_number',
      'cvv',
      'card_pin',
      'authorization_code',
    ]);

    Telescope::hideRequestHeaders([
      'cookie',
      'x-csrf-token',
      'x-xsrf-token',
      'authorization',
      'x-paystack-signature',
    ]);
  }

  /**
   * Register the Telescope gate.
   *
   * This gate determines who can access Telescope in non-local environments.
   */
  protected function gate(): void
  {
    Gate::define('viewTelescope', function ($user) {
      return in_array($user->email, [
        'myckhel123@gmail.com',
        'myckhel1@hotmail.com'
      ]);
    });
  }
}
