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
        $allowedIncludes = ['ownedTurfs', 'players'];
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
            $allowedIncludes = ['ownedTurfs', 'players'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        return $query;
    }
}
