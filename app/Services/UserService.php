<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserService
{
  /**
   * Get filtered and paginated users.
   */
  public function getUsers(Request $request): LengthAwarePaginator
  {
    $query = $this->buildUserQuery($request);

    return $query->paginate($request->get('per_page', 15));
  }

  /**
   * Get a single user with optional relationships.
   */
  public function getUserWithRelations(User $user, array $includes = []): User
  {
    $allowedIncludes = ['ownedTurfs', 'players', 'belongingTurfs'];
    $validIncludes = array_intersect($includes, $allowedIncludes);

    if (!empty($validIncludes)) {
      $user->load($validIncludes);
    }

    return $user;
  }

  /**
   * Create a new user.
   */
  public function createUser(array $data): User
  {
    if (isset($data['password'])) {
      $data['password'] = Hash::make($data['password']);
    }

    return User::create($data);
  }

  /**
   * Update an existing user.
   */
  public function updateUser(User $user, array $data): User
  {
    if (isset($data['password'])) {
      $data['password'] = Hash::make($data['password']);
    }

    $user->update($data);

    return $user;
  }

  /**
   * Delete a user.
   */
  public function deleteUser(User $user): bool
  {
    return $user->delete();
  }

  /**
   * Build query for filtering users.
   */
  private function buildUserQuery(Request $request): Builder
  {
    $query = User::query();


    // Search by name or email
    if ($request->filled('search')) {
      $search = $request->search;
      $query->where(function ($q) use ($search) {
        $q->where('name', 'LIKE', "%{$search}%")
          ->orWhere('email', 'LIKE', "%{$search}%");
      });
    }

    // Load relationships if requested
    if ($request->filled('include')) {
      $includes = explode(',', $request->include);
      $allowedIncludes = ['ownedTurfs', 'players', 'belongingTurfs'];
      $validIncludes = array_intersect($includes, $allowedIncludes);

      if (!empty($validIncludes)) {
        $query->with($validIncludes);
      }
    }

    return $query;
  }

  /**
   * Get turfs that a user belongs to through their player relationships.
   */
  public function getUserBelongingTurfs(User $user, Request $request = null): \Illuminate\Support\Collection
  {
    $query = $user->belongingTurfs();

    // Filter by turf status if requested
    if ($request && $request->filled('is_active')) {
      $query->where('turfs.is_active', $request->boolean('is_active'));
    }

    // Filter by player status if requested
    if ($request && $request->filled('player_status')) {
      $query->wherePivot('status', $request->player_status);
    }

    // Filter by membership status if requested
    if ($request && $request->filled('is_member')) {
      $query->wherePivot('is_member', $request->boolean('is_member'));
    }

    $query->with(['players' => function ($q) use ($user) {
      $q->where('user_id', $user->id);
    }]);

    return $query->get();
  }
}
