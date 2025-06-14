<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTurfRequest;
use App\Http\Requests\UpdateTurfRequest;
use App\Http\Resources\TurfResource;
use App\Models\Turf;
use App\Services\TurfService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TurfController extends Controller
{
    protected TurfService $turfService;

    public function __construct(TurfService $turfService)
    {
        $this->turfService = $turfService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $turfs = $this->turfService->getTurfs($request);

        return TurfResource::collection($turfs);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTurfRequest $request): TurfResource
    {
        $turf = $this->turfService->createTurf($request->validated());

        return new TurfResource($turf);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Turf $turf): TurfResource
    {
        $includes = [];
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
        }

        $turf = $this->turfService->getTurfWithRelations($turf, $includes);

        return new TurfResource($turf);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTurfRequest $request, Turf $turf): TurfResource
    {
        $turf = $this->turfService->updateTurf($turf, $request->validated());

        return new TurfResource($turf);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Turf $turf): Response
    {
        $this->turfService->deleteTurf($turf);

        return response()->noContent();
    }
}
