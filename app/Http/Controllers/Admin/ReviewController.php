<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $approved = $request->string('approved')->toString();

        $reviews = Review::query()
            ->with(['client', 'master.user', 'appointment.service'])
            ->when($approved === 'yes', fn ($query) => $query->where('is_approved', true))
            ->when($approved === 'no', fn ($query) => $query->where('is_approved', false))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        // Through the resource so review.photo_url reaches the moderation table
        // and its detail modal; paginated() resolves the rows into plain arrays.
        $reviews->through(fn (Review $review): ReviewResource => new ReviewResource($review));

        return Inertia::render('Admin/Reviews/Index', [
            ...$this->paginated($reviews, 'reviews'),
            'filters' => ['approved' => $approved],
        ]);
    }

    /**
     * Publishes a review and refreshes the master's cached rating, which counts
     * approved reviews only.
     */
    public function approve(Review $review): RedirectResponse
    {
        if ($review->is_approved) {
            return back()->with('error', 'Этот отзыв уже опубликован.');
        }

        $review->update(['is_approved' => true]);
        $review->master?->recalculateRating();

        return back()->with('success', 'Отзыв опубликован.');
    }

    /**
     * Withdraws a published review. The cached rating counts approved reviews
     * only, so it has to be recomputed in both directions.
     */
    public function unapprove(Review $review): RedirectResponse
    {
        if (! $review->is_approved) {
            return back()->with('error', 'Этот отзыв ещё не опубликован.');
        }

        $review->update(['is_approved' => false]);
        $review->master?->recalculateRating();

        return back()->with('success', 'Отзыв снят с публикации.');
    }

    public function destroy(Review $review): RedirectResponse
    {
        $master = $review->master;

        $review->delete();

        // Deleting an approved review changes the average.
        $master?->recalculateRating();

        return back()->with('success', 'Отзыв удалён.');
    }
}
