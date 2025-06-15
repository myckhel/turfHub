<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TurfPermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * This middleware sets the turf context for permissions based on the current request.
     * It looks for turf_id in route parameters, query parameters, or request body.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $turfId = $this->extractTurfId($request);

            if ($turfId) {
                // Set the turf context for permissions
                setPermissionsTeamId($turfId);

                // Store turf_id in session for later use
                session(['current_turf_id' => $turfId]);
            } else {
                // Try to get turf_id from session
                $sessionTurfId = session('current_turf_id');
                if ($sessionTurfId) {
                    setPermissionsTeamId($sessionTurfId);
                }
            }
        }

        return $next($request);
    }

    /**
     * Extract turf ID from the request.
     */
    private function extractTurfId(Request $request): ?int
    {
        // First, try route parameters
        if ($request->route('turf')) {
            return is_object($request->route('turf'))
                ? $request->route('turf')->id
                : (int) $request->route('turf');
        }

        if ($request->route('turf_id')) {
            return (int) $request->route('turf_id');
        }

        // Then try query parameters
        if ($request->has('turf_id')) {
            return (int) $request->get('turf_id');
        }

        // Finally, try request body
        if ($request->has('turf_id')) {
            return (int) $request->input('turf_id');
        }

        // If working with a player, get turf from player
        if ($request->route('player')) {
            $player = is_object($request->route('player'))
                ? $request->route('player')
                : \App\Models\Player::find($request->route('player'));

            return $player?->turf_id;
        }

        // If working with a match session, get turf from match session
        if ($request->route('match_session')) {
            $matchSession = is_object($request->route('match_session'))
                ? $request->route('match_session')
                : \App\Models\MatchSession::find($request->route('match_session'));

            return $matchSession?->turf_id;
        }

        return null;
    }
}
