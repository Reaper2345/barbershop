<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReviewResource;
use App\Models\Category;
use App\Models\Master;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Category::query()
            ->ordered()
            ->with([
                'services' => fn ($query) => $query->active()->orderBy('name'),
            ])
            ->get();

        $masters = Master::query()
            ->active()
            ->with([
                'user',
                /*
                 * MasterCard's badge renders `master.services.length`, so the
                 * relation itself has to be loaded. `withCount('services')`
                 * alone only adds a `services_count` attribute that the card
                 * does not read, and every home-page card kept showing 0.
                 */
                'services' => fn ($query) => $query
                    ->where('master_service.is_active', true)
                    ->orderBy('name'),
            ])
            ->withCount(['reviews', 'services'])
            ->orderByDesc('rating')
            ->limit(3)
            ->get();

        $reviews = Review::query()
            ->approved()
            ->with(['client', 'master.user'])
            ->latest('created_at')
            ->limit(6)
            ->get();

        return Inertia::render('Home/Index', [
            'categories' => $categories,
            'masters' => $masters,
            // Resolved, not raw: the card reads review.photo_url / photo_path.
            'reviews' => ReviewResource::collection($reviews)->resolve($request),
        ]);
    }
}
