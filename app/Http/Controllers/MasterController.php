<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReviewResource;
use App\Models\Category;
use App\Models\Master;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasterController extends Controller
{
    public function index(Request $request): Response
    {
        $masters = Master::query()
            ->active()
            ->with([
                'user',
                // The pivot carries this master's own price/duration overrides,
                // which the cards display instead of the catalogue price.
                'services' => fn ($query) => $query
                    ->where('master_service.is_active', true)
                    ->with('category'),
            ])
            ->withCount('reviews')
            ->orderByDesc('rating')
            ->get();

        // Only categories that at least one active master actually works in,
        // so the client-side filter can never produce an empty result set.
        $categories = Category::query()
            ->ordered()
            ->whereHas('services.masters', fn ($query) => $query->where('masters.is_active', true))
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Masters/Index', [
            'masters' => $masters,
            'categories' => $categories,
        ]);
    }

    public function show(Request $request, Master $master): Response
    {
        $master->load([
            'user',
            'services' => fn ($query) => $query->where('master_service.is_active', true),
            'schedules' => fn ($query) => $query->where('is_active', true)->orderBy('weekday'),
        ]);

        $this->authorize('view', $master);

        $reviews = Review::query()
            ->where('master_id', $master->id)
            ->approved()
            ->with('client')
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();

        // Resolved through the resource (not raw models) so review.photo_url
        // exists; the paginator envelope is preserved for <Pagination>.
        $reviews->through(
            fn (Review $review): array => (new ReviewResource($review))->resolve($request),
        );

        /*
         * Showcase works: the page shows the first six and links to the public
         * wall when there are more, so the section never grows unbounded.
         */
        $portfolio = $master->portfolioItems()->published()->get();

        return Inertia::render('Masters/Show', [
            'master' => $master,
            'reviews' => $reviews,
            'portfolio' => [
                'items' => $portfolio->take(6)->values(),
                'total' => $portfolio->count(),
            ],
        ]);
    }
}
