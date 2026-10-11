<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $role = $request->string('role')->toString();
        $search = $request->string('search')->toString();

        $users = User::query()
            ->with('master')
            ->withCount('appointments')
            ->when($role !== '', fn ($query) => $query->where('role', $role))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%');
            }))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            ...$this->paginated($users, 'users'),
            'roles' => array_map(
                static fn (Role $role): array => [
                    'value' => $role->value,
                    'label' => $role->label(),
                ],
                Role::cases(),
            ),
            'filters' => ['role' => $role, 'search' => $search],
        ]);
    }

    /**
     * Changes a user's role, keeping users.role and the Spatie roles in step.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(Role::values())],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
        ], [
            'role.in' => 'Недопустимая роль.',
            'role.required' => 'Укажите роль пользователя.',
        ], [
            'role' => 'роль',
            'name' => 'имя',
            'phone' => 'телефон',
        ]);

        $target = Role::from($validated['role']);

        // An admin must not lock himself out of the panel.
        if ($user->id === $request->user()->id && $target !== Role::Admin) {
            throw ValidationException::withMessages([
                'role' => 'Нельзя снять роль администратора с собственной учётной записи.',
            ]);
        }

        // Demoting a master would orphan his Master profile and its bookings.
        if ($user->isMaster() && $target !== Role::Master && $user->master !== null) {
            throw ValidationException::withMessages([
                'role' => 'Сначала удалите профиль мастера, затем измените роль.',
            ]);
        }

        DB::transaction(function () use ($user, $validated, $target): void {
            $user->update([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'role' => $target,
            ]);

            $user->syncRoles([$target->value]);
        });

        return back()->with('success', 'Пользователь обновлён.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => 'Нельзя удалить собственную учётную запись.',
            ]);
        }

        // Deleting a client cascades to his appointments and reviews.
        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'Пользователь удалён.');
    }
}
