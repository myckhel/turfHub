<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQueueLogicRequest;
use App\Http\Requests\UpdateQueueLogicRequest;
use App\Http\Resources\QueueLogicResource;
use App\Models\QueueLogic;
use App\Services\QueueLogicService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class QueueLogicController extends Controller
{
    protected QueueLogicService $queueLogicService;

    public function __construct(QueueLogicService $queueLogicService)
    {
        $this->queueLogicService = $queueLogicService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $queueLogic = $this->queueLogicService->getQueueLogic($request);

        return QueueLogicResource::collection($queueLogic);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreQueueLogicRequest $request): QueueLogicResource
    {
        $queueLogic = $this->queueLogicService->createQueueLogic($request->validated());

        return new QueueLogicResource($queueLogic);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, QueueLogic $queueLogic): QueueLogicResource
    {
        $includes = [];
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
        }

        $queueLogic = $this->queueLogicService->getQueueLogicWithRelations($queueLogic, $includes);

        return new QueueLogicResource($queueLogic);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateQueueLogicRequest $request, QueueLogic $queueLogic): QueueLogicResource
    {
        $queueLogic = $this->queueLogicService->updateQueueLogic($queueLogic, $request->validated());

        return new QueueLogicResource($queueLogic);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QueueLogic $queueLogic): Response
    {
        $this->queueLogicService->deleteQueueLogic($queueLogic);

        return response()->noContent();
    }
}
