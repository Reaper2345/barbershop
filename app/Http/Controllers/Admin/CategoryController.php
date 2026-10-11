<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->withCount('services')
            ->ordered()
            ->paginate(30);

        return Inertia::render('Admin/Categories/Index', [
            ...$this->paginated($categories, 'categories'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Categories/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatePayload($request);

        Category::create($data);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Категория добавлена.');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $data = $this->validatePayload($request, $category->id);

        $category->update($data);

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Категория обновлена.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        // services.category_id cascades, so deleting would silently take the
        // services (and their bookings) with it. Refuse instead.
        if ($category->services()->exists()) {
            return back()->with(
                'error',
                'Нельзя удалить категорию: в ней есть услуги. Сначала перенесите или удалите их.',
            );
        }

        $category->delete();

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Категория удалена.');
    }

    /**
     * Shared validation for store/update; the slug is generated from the name
     * when the admin leaves it empty.
     *
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?int $ignoreId = null): array
    {
        $request->merge([
            'slug' => $request->filled('slug')
                ? Str::slug($request->string('slug')->toString())
                : Str::slug($request->string('name')->toString()),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->ignore($ignoreId),
            ],
            'sort_order' => ['required', 'integer', 'min:0', 'max:10000'],
        ], [
            'slug.regex' => 'Адрес (slug) может содержать только строчные латинские буквы, цифры и дефис.',
            'slug.unique' => 'Такая категория уже существует.',
        ], [
            'name' => 'название',
            'slug' => 'адрес',
            'sort_order' => 'порядок сортировки',
        ]);

        return $data;
    }
}
