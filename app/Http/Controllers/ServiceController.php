<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Category::query()
            ->ordered()
            ->with([
                'services' => fn ($query) => $query->active()->orderBy('name'),
            ])
            // The services page shows a per-category count in its header.
            ->withCount([
                'services' => fn ($query) => $query->active(),
            ])
            ->get();

        return Inertia::render('Services/Index', [
            'categories' => $categories,
        ]);
    }
}
