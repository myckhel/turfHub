<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQueueLogicRequest;
use App\Http\Requests\UpdateQueueLogicRequest;
use App\Http\Resources\QueueLogicResource;
use App\Models\QueueLogic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class QueueLogicController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = QueueLogic::query();

        // Filter by match session
        if ($request->filled('match_session_id')) {
            $query->where('match_session_id', $request->match_session_id);
        }

        // Filter by team
        if ($request->filled('team_id')) {
            $query->where('team_id', $request->team_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['matchSession', 'team'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $query->with($validIncludes);
            }
        }

        $queueLogic = $query->orderBy('queue_position', 'asc')->paginate($request->get('per_page', 15));

        return QueueLogicResource::collection($queueLogic);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreQueueLogicRequest $request): QueueLogicResource
    {
        $queueLogic = QueueLogic::create($request->validated());

        return new QueueLogicResource($queueLogic);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, QueueLogic $queueLogic): QueueLogicResource
    {
        // Load relationships if requested
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
            $allowedIncludes = ['matchSession', 'team'];
            $validIncludes = array_intersect($includes, $allowedIncludes);

            if (!empty($validIncludes)) {
                $queueLogic->load($validIncludes);
            }
        }

        return new QueueLogicResource($queueLogic);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateQueueLogicRequest $request, QueueLogic $queueLogic): QueueLogicResource
    {
        $queueLogic->update($request->validated());

        return new QueueLogicResource($queueLogic);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QueueLogic $queueLogic): Response
    {
        $queueLogic->delete();

        return response()->noContent();
    }
}
