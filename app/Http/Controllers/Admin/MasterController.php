<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Master;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MasterController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Master::class);

        $masters = Master::query()
            ->with('user')
            ->withCount(['appointments', 'reviews'])
            ->withCount(['services' => fn ($query) => $query->where('master_service.is_active', true)])
            ->orderByDesc('rating')
            ->paginate(20);

        return Inertia::render('Admin/Masters/Index', [
            ...$this->paginated($masters, 'masters'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Master::class);

        // Masters are created by attaching a Master profile to an existing user
        // (legacy inline path) or by creating a fresh account in store().
        return Inertia::render('Admin/Masters/Create', [
            'candidateUsers' => User::query()
                ->whereDoesntHave('master')
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    /**
     * The brief's create form builds the user account inline, so `store()`
     * accepts either an existing `user_id` (legacy path) or a new account's
     * credentials + the master profile + an optional photo upload.
     *
     * @return array<string, array<int, mixed>>
     */
    private function rules(bool $creatingUser): array
    {
        return [
            // Either an existing user, or a brand-new account.
            'user_id' => [
                $creatingUser ? 'nullable' : 'required',
                'integer',
                Rule::exists('users', 'id'),
                Rule::unique('masters', 'user_id'),
            ],
            'name' => [$creatingUser ? 'required' : 'nullable', 'string', 'min:2', 'max:255'],
            'email' => [
                $creatingUser ? 'required' : 'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => [$creatingUser ? 'required' : 'nullable', 'string', 'min:8', 'confirmed'],

            'bio' => ['nullable', 'string', 'max:5000'],
            // The form uploads a file; `photo` as a plain string path is still
            // accepted by update() for API/seed use.
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'experience_years' => ['required', 'integer', 'min:0', 'max:80'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function ruleMessages(): array
    {
        return [
            'user_id.unique' => 'У этого пользователя уже есть профиль мастера.',
            'user_id.exists' => 'Выбранный пользователь не найден.',
            'user_id.required' => 'Выберите пользователя или создайте нового.',
            'email.unique' => 'Пользователь с таким email уже существует.',
            'password.confirmed' => 'Пароли не совпадают.',
            'password.min' => 'Пароль должен содержать не менее 8 символов.',
            'photo.max' => 'Фотография не должна превышать 5 МБ.',
            'photo.image' => 'Фотография должна быть изображением.',
        ];
    }

    /**
     * @return array<string, string>
     */
    private function ruleAttributes(): array
    {
        return [
            'user_id' => 'пользователь',
            'name' => 'имя',
            'email' => 'email',
            'phone' => 'телефон',
            'password' => 'пароль',
            'bio' => 'описание',
            'photo' => 'фотография',
            'experience_years' => 'опыт работы',
            'is_active' => 'активность',
        ];
    }

    /**
     * Store the uploaded photo on the public disk, under masters/.
     *
     * Requires `php artisan storage:link` so /storage/... is reachable.
     */
    private function storePhoto(Request $request, int $masterId): ?string
    {
        if (! $request->hasFile('photo')) {
            return null;
        }

        $file = $request->file('photo');

        if ($file === null) {
            return null;
        }

        // Deterministic name keeps re-uploads from accumulating files.
        return $file->storeAs(
            'masters',
            $masterId.'.'.strtolower($file->getClientOriginalExtension()),
            ['disk' => 'public'],
        );
    }

    /**
     * Update one master's profile via the shared Form component.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Master::class);

        $creatingUser = ! $request->filled('user_id');

        $data = $request->validate(
            $this->rules($creatingUser),
            $this->ruleMessages(),
            $this->ruleAttributes(),
        );

        /** @var Master $master */
        $master = DB::transaction(function () use ($data, $creatingUser): Master {
            if ($creatingUser) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'role' => Role::Master,
                    'password' => $data['password'],
                ]);
                $user->syncRoles([Role::Master->value]);

                $userId = $user->id;
            } else {
                $userId = (int) $data['user_id'];

                // Keep the denormalised role column and Spatie roles in step.
                $user = User::findOrFail($userId);
                $user->update(['role' => Role::Master]);
                $user->syncRoles([Role::Master->value]);
            }

            return Master::create([
                'user_id' => $userId,
                'bio' => $data['bio'] ?? null,
                'photo' => null,
                'experience_years' => $data['experience_years'],
                'rating' => 0,
                'is_active' => (bool) $data['is_active'],
            ]);
        });

        // Stored after creation so the file name can carry the master id.
        $path = $this->storePhoto($request, $master->id);

        if ($path !== null) {
            $master->forceFill(['photo' => $path])->save();
        }

        return redirect()
            ->route('admin.masters.index')
            ->with('success', 'Мастер добавлен.');
    }

    public function edit(Master $master): Response
    {
        $this->authorize('update', $master);

        $master->load('user');

        return Inertia::render('Admin/Masters/Edit', [
            'master' => $master,
        ]);
    }

    public function update(Request $request, Master $master): RedirectResponse
    {
        $this->authorize('update', $master);

        $data = $request->validate([
            'bio' => ['nullable', 'string', 'max:5000'],
            // A new upload replaces the current photo; no file means "keep".
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            // Explicit «Удалить фото» — the form sends 1 when the admin asked
            // for the current photo to be cleared.
            'remove_photo' => ['nullable', 'boolean'],
            'experience_years' => ['required', 'integer', 'min:0', 'max:80'],
            'is_active' => ['required', 'boolean'],
        ], $this->ruleMessages(), [
            'bio' => 'описание',
            'photo' => 'фотография',
            'experience_years' => 'опыт работы',
            'is_active' => 'активность',
        ]);

        // rating is intentionally not editable: it is derived from reviews.
        unset($data['photo'], $data['remove_photo']);

        $previousPhoto = $master->photo;

        $path = $this->storePhoto($request, $master->id);

        /*
         * Whether THIS request actually asks for a different photo. The flag
         * cannot be derived later from `$data['photo'] ?? $previousPhoto`:
         * `??` also falls through on an existing-but-null value, so the
         * explicit «Удалить фото» branch (photo = null) would look unchanged
         * and the old file would survive as an orphan.
         */
        $photoChanged = false;

        if ($path !== null) {
            $data['photo'] = $path;
            $photoChanged = true;
        } elseif ($request->boolean('remove_photo')) {
            $data['photo'] = null;
            $photoChanged = true;
        }

        $master->update($data);

        /*
         * Drop the old file only when this save replaced it (different path) or
         * cleared it. A save that sends no photo input leaves the column and
         * the file untouched — comparing against null there used to delete a
         * file the row still referenced, and /masters/{id} then rendered a
         * broken image.
         */
        if ($photoChanged && $previousPhoto !== null && $previousPhoto !== $path) {
            Storage::disk('public')->delete($previousPhoto);
        }

        return redirect()
            ->route('admin.masters.index')
            ->with('success', 'Профиль мастера обновлён.');
    }

    public function destroy(Master $master): RedirectResponse
    {
        $this->authorize('delete', $master);

        DB::transaction(function () use ($master): void {
            $user = $master->user;

            $master->delete();

            // The user survives; he simply stops being a master.
            if ($user !== null) {
                $user->update(['role' => Role::Client]);
                $user->syncRoles([Role::Client->value]);
            }
        });

        return redirect()
            ->route('admin.masters.index')
            ->with('success', 'Мастер удалён.');
    }
}
