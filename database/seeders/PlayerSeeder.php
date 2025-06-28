<?php

namespace Database\Seeders;

use App\Models\Player;
use App\Models\Turf;
use App\Models\User;
use Illuminate\Database\Seeder;

class PlayerSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // Get all players
    $playerUsers = User::role('player')->get();
    $turfs = Turf::whereId('is_active', true)->get();

    // If we don't have enough player users, create some
    if ($playerUsers->count() < 50) {
      $additionalPlayers = User::factory()
        ->count(50 - $playerUsers->count())
        ->player()
        ->create();
      $playerUsers = $playerUsers->merge($additionalPlayers);
    }

    foreach ($playerUsers as $playerUser) {
      // Each player can be registered at 1-3 turfs
      $turfCount = fake()->numberBetween(1, 3);
      $selectedTurfs = $turfs->random($turfCount);

      foreach ($selectedTurfs as $turf) {
        // Determine if player is a member based on turf requirements
        $isMember = false;
        if ($turf->requires_membership) {
          $isMember = fake()->boolean(80); // 80% chance of being a member if turf requires it
        } else {
          $isMember = fake()->boolean(30); // 30% chance of being a member if turf doesn't require it
        }

        Player::factory()->create([
          'user_id' => $playerUser->id,
          'turf_id' => $turf->id,
          'is_member' => $isMember,
          'status' => fake()->randomElement(['active', 'active', 'active', 'inactive']), // More active players
        ]);
      }
    }

    // Create some additional random players
    Player::factory()->count(30)->create();

    // Create some banned players
    Player::factory()->count(5)->banned()->create();
  }
}
