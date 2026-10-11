<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReviewResource;
use App\Models\Master;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public review wall (GET /reviews).
 *
 * Kept separate from ReviewController, which only handles the cabinet's
 * "leave a review" POST — the two have nothing in common beyond the model.
 */
class PublicReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $masterId = $request->integer('master');

        $reviews = Review::query()
            ->approved()
            ->with(['client', 'master.user'])
            ->when($masterId > 0, fn ($query) => $query->where('master_id', $masterId))
            ->latest('created_at')
            ->paginate(12)
            ->withQueryString();

        /*
         * Rows are resolved eagerly so the prop stays a plain Laravel paginator
         * (data / links / meta) that <Pagination> understands. Leaving the
         * resource objects unresolved would hand Inertia a Responsable per row,
         * which it answers by wrapping each one in a `data` key.
         */
        $reviews->through(
            fn (Review $review): array => (new ReviewResource($review))->resolve($request),
        );

        return Inertia::render('Reviews/Index', [
            'reviews' => $reviews,
            'masters' => $this->reviewedMasters(),
            'filters' => ['master' => $masterId > 0 ? $masterId : null],
        ]);
    }

    /**
     * Masters that have at least one approved review — the filter never offers
     * a choice that would return an empty page.
     *
     * @return list<array<string, mixed>>
     */
    private function reviewedMasters(): array
    {
        return Master::query()
            ->with('user')
            ->whereHas('reviews', fn ($query) => $query->where('is_approved', true))
            ->withCount([
                'reviews as review_count' => fn ($query) => $query->where('is_approved', true),
            ])
            ->orderByDesc('review_count')
            ->get()
            ->map(fn (Master $master): array => [
                'id' => $master->id,
                'name' => $master->user?->name ?? 'Мастер #'.$master->id,
                'photo_url' => $master->photo === null ? null : asset('storage/'.$master->photo),
                'review_count' => (int) $master->review_count,
            ])
            ->values()
            ->all();
    }
}
