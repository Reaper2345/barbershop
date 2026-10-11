<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function index(): Response
    {
        $pages = Page::query()->orderBy('slug')->paginate(30);

        return Inertia::render('Admin/Pages/Index', [
            ...$this->paginated($pages, 'pages'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Pages/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        Page::create($this->validatePayload($request));

        return redirect()
            ->route('admin.pages.index')
            ->with('success', 'Страница создана.');
    }

    public function edit(Page $page): Response
    {
        return Inertia::render('Admin/Pages/Edit', [
            'page' => $page,
        ]);
    }

    public function update(Request $request, Page $page): RedirectResponse
    {
        $page->update($this->validatePayload($request, $page->id));

        return redirect()
            ->route('admin.pages.index')
            ->with('success', 'Страница обновлена.');
    }

    public function destroy(Page $page): RedirectResponse
    {
        $page->delete();

        return redirect()
            ->route('admin.pages.index')
            ->with('success', 'Страница удалена.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?int $ignoreId = null): array
    {
        $request->merge([
            'slug' => $request->filled('slug')
                ? Str::slug($request->string('slug')->toString())
                : Str::slug($request->string('title')->toString()),
        ]);

        return $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('pages', 'slug')->ignore($ignoreId),
            ],
            'content' => ['required', 'string'],
            'is_published' => ['required', 'boolean'],
        ], [
            'slug.regex' => 'Адрес (slug) может содержать только строчные латинские буквы, цифры и дефис.',
            'slug.unique' => 'Страница с таким адресом уже существует.',
            'content.required' => 'Добавьте содержимое страницы.',
        ], [
            'title' => 'заголовок',
            'slug' => 'адрес',
            'content' => 'содержимое',
            'is_published' => 'публикация',
        ]);
    }
}
