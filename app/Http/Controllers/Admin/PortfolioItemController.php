<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HandlesPortfolioPhotos;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePortfolioItemRequest;
use App\Http\Requests\Admin\UpdatePortfolioItemRequest;
use App\Models\Master;
use App\Models\PortfolioItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioItemController extends Controller
{
    use HandlesPortfolioPhotos;

    public function index(Request $request): Response
    {
        $masterId = $request->integer('master') ?: null;

        $items = PortfolioItem::query()
            ->with('master.user')
            ->when($masterId !== null, fn ($query) => $query->where('master_id', $masterId))
            ->orderBy('master_id')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Portfolio/Index', [
            ...$this->paginated($items, 'items'),
            'masters' => $this->masterOptions(),
            'filters' => [
                'master' => $masterId,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Portfolio/Form', [
            'item' => null,
            'masters' => $this->masterOptions(),
        ]);
    }

    public function store(StorePortfolioItemRequest $request): RedirectResponse
    {
        $data = $request->validated();

        unset($data['remove_photo']);

        $data['photo_path'] = $this->storePortfolioPhoto($request)
            ?? $this->withoutPortfolioPhoto();
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);
        $data['is_published'] = $request->boolean('is_published');

        PortfolioItem::create($data);

        return redirect()
            ->route('admin.portfolio.index')
            ->with('success', 'Работа добавлена в портфолио.');
    }

    public function edit(PortfolioItem $item): Response
    {
        $item->load('master.user');

        return Inertia::render('Admin/Portfolio/Form', [
            'item' => $item,
            'masters' => $this->masterOptions(),
        ]);
    }

    public function update(UpdatePortfolioItemRequest $request, PortfolioItem $item): RedirectResponse
    {
        $data = $request->validated();

        unset($data['photo'], $data['remove_photo']);

        $previousPath = $item->photo_path;

        $newPath = $this->storePortfolioPhoto($request);

        /*
         * Whether THIS request actually asks for a different photo. The flag
         * cannot be derived later from `$data['photo_path'] ?? $previousPath`:
         * `??` also falls through on an existing-but-null value, so an explicit
         * reset would look unchanged and the old file would survive as an
         * orphan.
         */
        $photoChanged = false;

        if ($newPath !== null) {
            $data['photo_path'] = $newPath;
            $photoChanged = true;
        } elseif ($request->boolean('remove_photo')) {
            // The column is NOT NULL, so a reset falls back to a bundled
            // placeholder instead of null.
            $data['photo_path'] = $this->withoutPortfolioPhoto();
            $photoChanged = true;
        }

        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);
        $data['is_published'] = $request->boolean('is_published');

        $item->update($data);

        if ($photoChanged && $previousPath !== $data['photo_path']) {
            $this->deletePortfolioPhoto($previousPath);
        }

        return redirect()
            ->route('admin.portfolio.index')
            ->with('success', 'Работа обновлена.');
    }

    /**
     * Publish / unpublish without opening the edit form.
     */
    public function toggle(PortfolioItem $item): RedirectResponse
    {
        $item->update(['is_published' => ! $item->is_published]);

        return back()->with(
            'success',
            $item->is_published ? 'Работа опубликована.' : 'Работа скрыта с сайта.',
        );
    }

    public function destroy(PortfolioItem $item): RedirectResponse
    {
        $this->deletePortfolioPhoto($item->photo_path);

        $item->delete();

        return back()->with('success', 'Работа удалена.');
    }

    /**
     * Masters for the "мастер" select, keyed by profile id.
     *
     * @return array<int, array{id: int, name: string}>
     */
    private function masterOptions(): array
    {
        return Master::query()
            ->with('user')
            ->orderBy('id')
            ->get()
            ->map(fn (Master $master): array => [
                'id' => $master->id,
                'name' => $master->user?->name ?? 'Мастер #'.$master->id,
            ])
            ->all();
    }
}
