<?php

namespace App\Services;

use App\Models\TeamPlayer;
use Illuminate\Support\Facades\Log;

class TeamSlotCleanupService
{
  /**
   * Cleanup expired team slot reservations.
   * 
   * @return array
   */
  public function cleanupExpiredReservations(): array
  {
    try {
      $expiredCount = TeamPlayer::expired()->count();

      if ($expiredCount > 0) {
        TeamPlayer::expired()->delete();

        Log::info('Cleaned up expired team slot reservations', [
          'expired_count' => $expiredCount
        ]);
      }

      return [
        'success' => true,
        'message' => "Cleaned up {$expiredCount} expired reservations",
        'expired_count' => $expiredCount
      ];
    } catch (\Exception $e) {
      Log::error('Failed to cleanup expired reservations', [
        'error' => $e->getMessage()
      ]);

      return [
        'success' => false,
        'message' => 'Failed to cleanup expired reservations: ' . $e->getMessage(),
        'expired_count' => 0
      ];
    }
  }
}
