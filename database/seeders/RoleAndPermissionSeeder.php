<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Turf management permissions
            'manage turf settings',
            'invite players',
            'remove players',
            'view turf analytics',

            // Match session permissions
            'create match sessions',
            'manage match sessions',
            'start matches',
            'end matches',
            'assign teams',

            // Team management permissions
            'create teams',
            'manage teams',
            'assign players to teams',
            'remove players from teams',

            // Match event permissions
            'record match events',
            'edit match events',
            'view match history',

            // Payment permissions
            'view payment history',
            'process refunds',

            // Player permissions
            'join teams',
            'leave teams',
            'view own stats',
            'make payments',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create global roles (with team ID 0 to represent global context)
        // Set team context to 0 for global roles (since null doesn't work with teams enabled)
        $currentTeamId = getPermissionsTeamId();
        setPermissionsTeamId(0);

        Role::firstOrCreate(['name' => User::ROLE_SUPER_ADMIN]);

        // Restore team context
        setPermissionsTeamId($currentTeamId);

        // Create turf-specific roles (these will be used with team context)
        $adminRole = Role::firstOrCreate(['name' => User::TURF_ROLE_ADMIN]);
        $managerRole = Role::firstOrCreate(['name' => User::TURF_ROLE_MANAGER]);
        $playerRole = Role::firstOrCreate(['name' => User::TURF_ROLE_PLAYER]);

        // Assign permissions to turf admin role
        $adminRole->givePermissionTo([
            'manage turf settings',
            'invite players',
            'remove players',
            'view turf analytics',
            'create match sessions',
            'manage match sessions',
            'start matches',
            'end matches',
            'assign teams',
            'create teams',
            'manage teams',
            'assign players to teams',
            'remove players from teams',
            'record match events',
            'edit match events',
            'view match history',
            'view payment history',
            'process refunds',
        ]);

        // Assign permissions to turf manager role
        $managerRole->givePermissionTo([
            'create match sessions',
            'manage match sessions',
            'start matches',
            'end matches',
            'assign teams',
            'create teams',
            'manage teams',
            'assign players to teams',
            'remove players from teams',
            'record match events',
            'edit match events',
            'view match history',
            'view payment history',
        ]);

        // Assign permissions to turf player role
        $playerRole->givePermissionTo([
            'join teams',
            'leave teams',
            'view own stats',
            'make payments',
            'view match history',
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}
