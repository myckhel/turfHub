# TurfHub Permission System Documentation

## Overview

The TurfHub application now uses [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission/v6/introduction) with **Teams** functionality to manage turf-specific roles and permissions. This allows players to have different roles in different turfs.

## Architecture

### Key Components

1. **Spatie Permission Package**: Handles role and permission management
2. **Teams Feature**: Each turf acts as a "team" for permission scoping
3. **TurfPermissionService**: Service class for managing turf-specific permissions
4. **TurfPermissionMiddleware**: Middleware to set turf context for requests
5. **Policies**: Authorization policies using the new permission system

### Permission Structure

```
Global Roles:
├── super-admin (system-wide administrative access)

Turf-Specific Roles (scoped by turf_id):
├── admin (turf owner level permissions)
├── manager (match and team management)
└── player (basic player permissions)
```

## Role Definitions

### Global Roles

- **super-admin**: System-wide administrative access (for platform administrators)

### Turf-Specific Roles

- **admin**: Full control over turf settings, players, and all operations
- **manager**: Can manage match sessions, teams, and match events
- **player**: Can join teams, make payments, and view match history

## Permissions

### Turf Management
- `manage turf settings`
- `invite players`
- `remove players`
- `view turf analytics`

### Match Session Management
- `create match sessions`
- `manage match sessions`
- `start matches`
- `end matches`
- `assign teams`

### Team Management
- `create teams`
- `manage teams`
- `assign players to teams`
- `remove players from teams`

### Match Events
- `record match events`
- `edit match events`
- `view match history`

### Payments
- `view payment history`
- `process refunds`

### Player Actions
- `join teams`
- `leave teams`
- `view own stats`
- `make payments`

## Usage Examples

### Checking Permissions in Controllers

```php
// Check if user can manage a turf
if (auth()->user()->can('manage turf settings')) {
    // User can manage turf settings in current turf context
}

// Check permissions for a specific turf
$turfPermissionService = app(TurfPermissionService::class);
if ($turfPermissionService->userCanInTurf(auth()->user(), 'invite players', $turfId)) {
    // User can invite players to this specific turf
}
```

### Using Policies

```php
// In a controller
if (auth()->user()->can('update', $turf)) {
    // User can update this turf
}

if (auth()->user()->can('manageMatchSessions', $turf)) {
    // User can manage match sessions for this turf
}
```

### Managing Roles

```php
$turfPermissionService = app(TurfPermissionService::class);

// Add a player to a turf
$player = $turfPermissionService->addPlayerToTurf(
    $user, 
    $turf, 
    User::TURF_ROLE_PLAYER
);

// Promote a player to manager
$turfPermissionService->promoteToManager($user, $turfId);

// Remove a player from a turf
$turfPermissionService->removePlayerFromTurf($user, $turf);
```

### Checking User Roles

```php
$user = auth()->user();

// Check if user has a role in a specific turf
if ($user->isTurfAdmin($turfId)) {
    // User is admin in this turf
}

if ($user->belongsToTurf($turfId)) {
    // User has any role in this turf
}

// Get all turfs where user has roles
$turfIds = $user->getTurfsWithRoles();
```

## Migration from Old System

### Running the Migration

```bash
# First, ensure roles and permissions are seeded
php artisan db:seed --class=RoleAndPermissionSeeder

# Then migrate existing data
php artisan db:seed --class=MigrateToPermissionSystemSeeder
```

### Backward Compatibility

The system maintains backward compatibility during the transition:

1. Legacy role checking methods still work
2. Both old and new permission systems can be used simultaneously
3. Legacy role columns are preserved until migration is complete

### Post-Migration Cleanup

After confirming the new system works correctly:

1. Remove legacy role columns from database
2. Update all code to use new permission methods
3. Remove backward compatibility methods

## API Integration

### Resource Classes

The `TurfResource` now includes permission information:

```json
{
  "id": 1,
  "name": "Downtown Turf",
  "user_permissions": {
    "can_manage_turf": true,
    "can_invite_players": true,
    "can_remove_players": true,
    "can_manage_sessions": true,
    "can_create_teams": true,
    "can_view_analytics": true,
    "is_owner": true,
    "role_in_turf": "admin"
  },
  "role_counts": {
    "admins": 1,
    "managers": 2,
    "players": 15
  }
}
```

### Form Requests

Use `AssignTurfRoleRequest` for validating role assignments:

```php
public function assignRole(AssignTurfRoleRequest $request, Turf $turf)
{
    $turfPermissionService = app(TurfPermissionService::class);
    $user = User::findOrFail($request->user_id);
    
    $turfPermissionService->assignRoleToUserInTurf(
        $user,
        $request->role,
        $turf->id
    );
    
    return response()->json(['message' => 'Role assigned successfully']);
}
```

## Middleware

The `TurfPermissionMiddleware` automatically sets the turf context based on:

1. Route parameters (`turf`, `turf_id`)
2. Query parameters (`turf_id`)
3. Request body (`turf_id`)
4. Related models (player, match_session)

## Best Practices

### 1. Always Use Turf Context

When checking permissions for turf-specific operations, always set the turf context:

```php
// Good
$turfPermissionService->userCanInTurf($user, 'permission', $turfId);

// Or rely on middleware to set context
if (auth()->user()->can('permission')) {
    // This works if middleware has set the turf context
}
```

### 2. Use Service Class for Role Management

Always use `TurfPermissionService` for role assignments and permission checks:

```php
// Good
$turfPermissionService = app(TurfPermissionService::class);
$turfPermissionService->assignRoleToUserInTurf($user, $role, $turfId);

// Avoid direct Spatie calls without turf context
```

### 3. Leverage Policies

Use policies for complex authorization logic:

```php
// In controller
$this->authorize('manageMatchSessions', $turf);
```

### 4. Include Permissions in API Responses

Always include relevant permission information in API responses to enable frontend authorization:

```php
return new TurfResource($turf); // Includes user_permissions
```

## Testing

### Unit Tests

```php
public function test_user_can_manage_turf_with_admin_role()
{
    $user = User::factory()->create();
    $turf = Turf::factory()->create();
    
    $turfPermissionService = app(TurfPermissionService::class);
    $turfPermissionService->assignRoleToUserInTurf(
        $user, 
        User::TURF_ROLE_ADMIN, 
        $turf->id
    );
    
    $this->assertTrue(
        $turfPermissionService->userCanInTurf($user, 'manage turf settings', $turf->id)
    );
}
```

### Feature Tests

```php
public function test_admin_can_invite_players()
{
    $admin = User::factory()->create();
    $turf = Turf::factory()->create(['owner_id' => $admin->id]);
    
    $response = $this->actingAs($admin)
        ->postJson("/api/turfs/{$turf->id}/players", [
            'user_id' => User::factory()->create()->id,
            'role' => User::TURF_ROLE_PLAYER
        ]);
    
    $response->assertStatus(200);
}
```

## Performance Considerations

1. **Caching**: Spatie Permission caches permissions automatically
2. **Eager Loading**: Load roles and permissions when needed to avoid N+1 queries
3. **Context Switching**: Minimize turf context switches in the same request

## Troubleshooting

### Common Issues

1. **Permission not found**: Ensure permissions are seeded
2. **Role not working**: Check if turf context is set correctly
3. **Migration issues**: Run seeders in correct order

### Debug Commands

```bash
# Clear permission cache
php artisan permission:cache-reset

# List all permissions
php artisan permission:show

# Create missing permissions
php artisan db:seed --class=RoleAndPermissionSeeder
```
