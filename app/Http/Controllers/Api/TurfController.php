<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTurfRequest;
use App\Http\Requests\UpdateTurfRequest;
use App\Http\Resources\TurfResource;
use App\Models\Turf;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TurfController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Turf::query();

        // Filter by owner
        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by membership requirement
        if ($request->filled('requires_membership')) {
            $query->where('requires_membership', $request->boolean('requires_membership'));
        }

        // Search by name or location
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('location', 'LIKE', "%{$search}%");
            });
        }

        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['owner', 'players', 'matchSessions', 'activeMatchSessions'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        $turfs = $query->paginate($request->get('per_page', 15));

        return TurfResource::collection($turfs);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTurfRequest $request): TurfResource
    {
        $turf = Turf::create($request->validated());

        return new TurfResource($turf);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Turf $turf): TurfResource
    {
        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['owner', 'players', 'matchSessions', 'activeMatchSessions'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $turf->load($validIncludes);
            }
        }

        return new TurfResource($turf);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTurfRequest $request, Turf $turf): TurfResource
    {
        $turf->update($request->validated());

        return new TurfResource($turf);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Turf $turf): Response
    {
        $turf->delete();

        return response()->noContent();
    }
}
