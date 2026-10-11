<?php

namespace App\Http\Controllers;

use App\Models\Master;
use App\Models\PortfolioItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    /**
     * Public showcase wall: /portfolio, optionally filtered by ?master={id}.
     *
     * Only published items are ever exposed here — unpublished ones stay
     * visible in the admin and master panels.
     */
    public function index(Request $request): Response
    {
        // integer() gives 0 for a missing/invalid query value; both mean "all".
        $masterId = $request->integer('master') ?: null;

        $masters = Master::query()
            // A master with nothing published would render a filter that leads
            // to an empty grid, so they are left out of the list entirely.
            ->whereHas('portfolioItems', fn ($query) => $query->where('is_published', true))
            ->with('user')
            ->withCount([
                'portfolioItems' => fn ($query) => $query->where('is_published', true),
            ])
            ->get()
            ->map(fn (Master $master): array => [
                'id' => $master->id,
                'name' => $master->user?->name ?? 'Мастер',
                // Raw storage path: the frontend resolves it through
                // masterPhoto(), so the /storage prefix lives in one place.
                'photo_url' => $master->photo,
                'items_count' => $master->portfolio_items_count,
            ])
            ->values()
            ->all();

        $items = PortfolioItem::query()
            ->published()
            ->with('master.user')
            ->when($masterId !== null, fn ($query) => $query->where('master_id', $masterId))
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('Portfolio/Index', [
            'masters' => $masters,
            'items' => $items,
            'filters' => [
                'master' => $masterId,
            ],
        ]);
    }
}
