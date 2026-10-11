<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Concerns\HandlesPortfolioPhotos;
use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StorePortfolioItemRequest;
use App\Http\Requests\Master\UpdatePortfolioItemRequest;
use App\Models\Master;
use App\Models\PortfolioItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasterPortfolioController extends Controller
{
    use HandlesPortfolioPhotos;

    /**
     * The master's own works, drafts included.
     */
    public function index(Request $request): Response
    {
        $master = $this->master($request);

        $items = PortfolioItem::query()
            ->where('master_id', $master->id)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate(20);

        return Inertia::render('Master/Portfolio/Index', [
            ...$this->paginated($items, 'items'),
        ]);
    }

    public function create(Request $request): Response
    {
        // Resolved up front so a user without a master profile gets the 403
        // instead of a broken form.
        $this->master($request);

        return Inertia::render('Master/Portfolio/Form', [
            'item' => null,
        ]);
    }

    public function store(StorePortfolioItemRequest $request): RedirectResponse
    {
        $master = $this->master($request);

        $data = $request->validated();

        unset($data['remove_photo']);

        // master_id is never taken from the request: a master may only create
        // works for himself.
        $data['master_id'] = $master->id;
        $data['photo_path'] = $this->storePortfolioPhoto($request)
            ?? $this->withoutPortfolioPhoto();
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);
        $data['is_published'] = $request->boolean('is_published');

        PortfolioItem::create($data);

        return redirect()
            ->route('master.portfolio.index')
            ->with('success', 'Работа добавлена в портфолио.');
    }

    public function edit(Request $request, PortfolioItem $item): Response
    {
        $this->authorizeItem($request, $item);

        return Inertia::render('Master/Portfolio/Form', [
            'item' => $item,
        ]);
    }

    public function update(UpdatePortfolioItemRequest $request, PortfolioItem $item): RedirectResponse
    {
        $this->authorizeItem($request, $item);

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
            ->route('master.portfolio.index')
            ->with('success', 'Работа обновлена.');
    }

    public function toggle(Request $request, PortfolioItem $item): RedirectResponse
    {
        $this->authorizeItem($request, $item);

        $item->update(['is_published' => ! $item->is_published]);

        return back()->with(
            'success',
            $item->is_published ? 'Работа опубликована.' : 'Работа скрыта с сайта.',
        );
    }

    public function destroy(Request $request, PortfolioItem $item): RedirectResponse
    {
        $this->authorizeItem($request, $item);

        $this->deletePortfolioPhoto($item->photo_path);

        $item->delete();

        return back()->with('success', 'Работа удалена.');
    }

    /**
     * The Master row behind the authenticated user.
     */
    private function master(Request $request): Master
    {
        $master = $request->user()->master;

        abort_if($master === null, 403, 'Профиль мастера не найден.');

        return $master;
    }

    /**
     * A master may only touch his own works. Guessing another master's item id
     * is a 403, never a silent no-op.
     */
    private function authorizeItem(Request $request, PortfolioItem $item): void
    {
        $master = $this->master($request);

        abort_if($item->master_id !== $master->id, 403, 'Это работа другого мастера.');
    }
}
