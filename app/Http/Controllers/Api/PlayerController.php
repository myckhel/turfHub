<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlayerRequest;
use App\Http\Requests\UpdatePlayerRequest;
use App\Http\Resources\PlayerResource;
use App\Models\Player;
use App\Services\PlayerService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PlayerController extends Controller
{
    protected PlayerService $playerService;

    public function __construct(PlayerService $playerService)
    {
        $this->playerService = $playerService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $players = $this->playerService->getPlayers($request);

        return PlayerResource::collection($players);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePlayerRequest $request): PlayerResource
    {
        $player = $this->playerService->createPlayer($request->validated());

        return new PlayerResource($player);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Player $player): PlayerResource
    {
        $includes = [];
        if ($request->filled('include')) {
            $includes = explode(',', $request->include);
        }

        $player = $this->playerService->getPlayerWithRelations($player, $includes);

        return new PlayerResource($player);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePlayerRequest $request, Player $player): PlayerResource
    {
        $player = $this->playerService->updatePlayer($player, $request->validated());

        return new PlayerResource($player);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Player $player): Response
    {
        $this->playerService->deletePlayer($player);

        return response()->noContent();
    }
}
