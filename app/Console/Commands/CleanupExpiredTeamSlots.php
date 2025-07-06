<?php

namespace App\Console\Commands;

use App\Services\TeamSlotCleanupService;
use Illuminate\Console\Command;

class CleanupExpiredTeamSlots extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'team-slots:cleanup-expired';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Cleanup expired team slot reservations';

  public function __construct(
    protected TeamSlotCleanupService $cleanupService
  ) {
    parent::__construct();
  }

  /**
   * Execute the console command.
   */
  public function handle(): int
  {
    $this->info('Starting cleanup of expired team slot reservations...');

    $result = $this->cleanupService->cleanupExpiredReservations();

    if ($result['success']) {
      $this->info($result['message']);
      return Command::SUCCESS;
    } else {
      $this->error($result['message']);
      return Command::FAILURE;
    }
  }
}
