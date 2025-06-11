<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@turfhub.com',
        ]);

        // Create test user
        User::factory()->player()->create([
            'name' => 'Test Player',
            'email' => 'test@example.com',
        ]);

        // Create realistic users
        User::factory()->count(20)->player()->create();
        User::factory()->count(8)->manager()->create();
        User::factory()->count(3)->admin()->create();

        // Seed all models in proper order (respecting relationships)
        $this->call([
            TurfSeeder::class,           // Creates turfs with managers
            MatchSessionSeeder::class,   // Creates match sessions for turfs
            PlayerSeeder::class,         // Creates players for turfs and users
            TeamSeeder::class,           // Creates teams for match sessions
            TeamPlayerSeeder::class,     // Associates players with teams
            GameMatchSeeder::class,      // Creates matches between teams
            MatchEventSeeder::class,     // Creates events for matches
            QueueLogicSeeder::class,     // Creates queue logic for active sessions
        ]);

        $this->command->info('Database seeded successfully with realistic TurfHub data!');
        $this->command->info('You can login with:');
        $this->command->info('Admin: admin@turfhub.com / password');
        $this->command->info('Test Player: test@example.com / password');
    }
}
