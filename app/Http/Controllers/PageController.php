<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * Static content page resolved by slug ("about", "contacts").
     *
     * The slug comes from the route; explicit /about and /contacts routes pass
     * it through route defaults, so the signature stays a plain string.
     */
    public function show(Request $request, string $slug): Response
    {
        $page = Page::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->first();

        abort_if($page === null, 404);

        return Inertia::render('Pages/Show', [
            'page' => $page,
        ]);
    }
}
