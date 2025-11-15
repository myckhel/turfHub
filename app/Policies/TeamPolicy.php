<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;
use App\Services\TurfPermissionService;

class TeamPolicy
{
  protected TurfPermissionService $turfPermissionService;

  public function __construct(TurfPermissionService $turfPermissionService)
  {
    $this->turfPermissionService = $turfPermissionService;
  }

  /**
   * Get the turf ID from a team.
   */
  protected function getTurfId(Team $team): ?int
  {
    return $team->matchSession?->turf_id ?? $team->tournament?->turf_id;
  }

  /**
   * Determine whether the user can view any teams.
   */
  public function viewAny(User $user): bool
  {
    return true; // Any authenticated user can view teams in their turfs
  }

  /**
   * Determine whether the user can view the team.
   */
  public function view(User $user, Team $team): bool
  {
    // User can view if they belong to the turf
    return $user->belongsToTurf($this->getTurfId($team));
  }

  /**
   * Determine whether the user can create teams.
   */
  public function create(User $user): bool
  {
    // Any user who is a manager or admin in any turf can create teams
    return $user->hasAnyTurfRole([User::TURF_ROLE_ADMIN, User::TURF_ROLE_MANAGER]);
  }

  /**
   * Determine whether the user can update the team.
   */
  public function update(User $user, Team $team): bool
  {
    // Team captain can update their team
    if ($team->captain_id === $user->id) {
      return true;
    }

    // Turf admins and managers can update teams
    return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $this->getTurfId($team));
  }

  /**
   * Determine whether the user can delete the team.
   */
  public function delete(User $user, Team $team): bool
  {
    // Only turf admins and managers can delete teams
    return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $this->getTurfId($team));
  }

  /**
   * Determine whether the user can join this team.
   */
  public function join(User $user, Team $team): bool
  {
    // User must be a player in the turf
    $turfId = $this->getTurfId($team);
    $player = $user->players()->where('turf_id', $turfId)->first();

    if (!$player || $player->status !== 'active') {
      return false;
    }

    // For match session teams, check if match session is in the right state
    if ($team->matchSession) {
      return in_array($team->matchSession->status, ['scheduled', 'active']);
    }

    // // For tournament teams, check if tournament is accepting players
    // if ($team->tournament) {
    //   return in_array($team->tournament->status, ['pending', 'active']);
    // }

    return false;
  }

  /**
   * Determine whether the user can leave this team.
   */
  public function leave(User $user, Team $team): bool
  {
    // User can leave if they are part of the team
    $isTeamMember = $team->teamPlayers()->whereHas('player', function ($query) use ($user) {
      $query->where('user_id', $user->id);
    })->exists();

    if (!$isTeamMember) {
      return false;
    }

    // For match session teams, check if match hasn't started
    if ($team->matchSession) {
      return $team->matchSession->status === 'scheduled';
    }

    // For tournament teams, check if tournament hasn't started
    // if ($team->tournament) {
    //   return $team->tournament->status === 'upcoming';
    // }

    return false;
  }

  /**
   * Determine whether the user can invite players to this team.
   */
  public function invitePlayers(User $user, Team $team): bool
  {
    // Team captain can invite players
    if ($team->captain_id === $user->id) {
      return true;
    }

    // Turf admins and managers can invite players to teams
    return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $this->getTurfId($team));
  }

  /**
   * Determine whether the user can join a team slot.
   */
  public function joinSlot(User $user, Team $team): bool
  {
    return $this->join($user, $team);
  }

  /**
   * Determine whether the user can leave a team slot.
   */
  public function leaveSlot(User $user, Team $team): bool
  {
    return $this->leave($user, $team);
  }

  /**
   * Determine whether the user can add players to team slots.
   */
  public function addPlayerToSlot(User $user, Team $team): bool
  {
    // Team captain can add players
    if ($team->captain_id === $user->id) {
      return true;
    }

    // Turf admins and managers can add players to teams
    return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $this->getTurfId($team));
  }

  /**
   * Determine whether the user can remove players from team slots.
   */
  public function removePlayerFromSlot(User $user, Team $team): bool
  {
    // Team captain can remove players (except themselves)
    if ($team->captain_id === $user->id) {
      return true;
    }

    // Turf admins and managers can remove players from teams
    return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $this->getTurfId($team));
  }

  /**
   * Determine whether the user can set team captain.
   */
  public function setCaptain(User $user, Team $team): bool
  {
    // Only turf admins and managers can set captains
    return $this->turfPermissionService->userCanInTurf($user, 'manage teams', $this->getTurfId($team));
  }

  /**
   * Determine whether the user can process slot payments.
   */
  public function processSlotPayment(User $user, Team $team): bool
  {
    // User must be a player in the turf
    $turfId = $this->getTurfId($team);
    $player = $user->players()->where('turf_id', $turfId)->first();

    if (!$player || $player->status !== 'active') {
      return false;
    }

    // User must be part of the team or able to join
    $isTeamMember = $team->teamPlayers()->whereHas('player', function ($query) use ($user) {
      $query->where('user_id', $user->id);
    })->exists();

    return $isTeamMember || $this->join($user, $team);
  }
}
