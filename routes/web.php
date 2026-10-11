<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\MasterController as AdminMasterController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\Admin\PortfolioItemController as AdminPortfolioItemController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ClientCabinetController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\Master\MasterAppointmentController;
use App\Http\Controllers\Master\MasterDashboardController;
use App\Http\Controllers\Master\MasterPortfolioController;
use App\Http\Controllers\Master\MasterProfileController;
use App\Http\Controllers\Master\MasterServiceController;
use App\Http\Controllers\Master\ScheduleController;
use App\Http\Controllers\Master\TimeOffController;
use App\Http\Controllers\MasterController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\PublicReviewController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\SlotController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
| These routes must exist for the `auth` middleware to work at all: without a
| route named `login`, an unauthenticated visit to a protected page throws
| RouteNotFoundException from UrlGenerator instead of redirecting.
|
| The `guest` alias ships with Laravel (bootstrapped by bootstrap/app.php), so
| no registration is needed here.
*/

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::get('/', [HomeController::class, 'index'])->name('home');

// The numeric constraint keeps /masters/create-style paths for PROMPT 2+ free.
Route::get('/masters', [MasterController::class, 'index'])->name('masters.index');
Route::get('/masters/{master}', [MasterController::class, 'show'])
    ->whereNumber('master')
    ->name('masters.show');

Route::get('/services', [ServiceController::class, 'index'])->name('services.index');

// Public review wall. Declared before the /{slug} CMS catch-all at the bottom
// of this file, which would otherwise swallow it.
Route::get('/reviews', [PublicReviewController::class, 'index'])->name('reviews.index');

// Public portfolio wall (?master={id}). Also declared before the /{slug}
// catch-all, which would otherwise serve a CMS page for /portfolio.
Route::get('/portfolio', [PortfolioController::class, 'index'])->name('portfolio.index');

Route::get('/about', [PageController::class, 'show'])
    ->defaults('slug', 'about')
    ->name('pages.about');

Route::get('/contacts', [PageController::class, 'show'])
    ->defaults('slug', 'contacts')
    ->name('pages.contacts');

// "Заказать звонок" modal.
Route::post('/call-request', [LeadController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('leads.call');

/*
|--------------------------------------------------------------------------
| Client area (any authenticated user; clients are the only role that books)
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {
    Route::get('/booking', [BookingController::class, 'create'])->name('booking.create');
    Route::post('/booking', [BookingController::class, 'store'])
        ->middleware('throttle:20,1')
        ->name('booking.store');

    /*
     * Slot lookup for the booking wizard.
     *
     * Deliberately a web route rather than an api.php route: it must run on the
     * session guard (so the logged-in Inertia user is visible) and behind the
     * web CSRF middleware. It answers JSON, hence the /api/ path prefix and the
     * `api.` route name.
     */
    Route::get('/api/slots', [SlotController::class, 'show'])
        ->middleware('throttle:60,1')
        ->name('api.slots');

    Route::get('/cabinet', [ClientCabinetController::class, 'index'])->name('cabinet.index');
    Route::get('/cabinet/appointments', [ClientCabinetController::class, 'appointments'])
        ->name('cabinet.appointments');

    Route::patch('/cabinet/appointments/{appointment}/cancel', [ClientCabinetController::class, 'cancel'])
        ->name('cabinet.appointments.cancel');

    Route::post('/cabinet/reviews', [ReviewController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('cabinet.reviews.store');

    // Logout lives in the auth group: only a signed-in user can log out.
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

/*
|--------------------------------------------------------------------------
| Master area
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:master'])
    ->prefix('master')
    ->name('master.')
    ->group(function () {
        Route::get('/dashboard', [MasterDashboardController::class, 'index'])->name('dashboard');

        Route::get('/schedule', [ScheduleController::class, 'edit'])->name('schedule.edit');
        Route::put('/schedule', [ScheduleController::class, 'update'])->name('schedule.update');

        Route::post('/time-off', [TimeOffController::class, 'store'])->name('time-off.store');
        Route::delete('/time-off/{timeOff}', [TimeOffController::class, 'destroy'])->name('time-off.destroy');

        Route::get('/services', [MasterServiceController::class, 'index'])->name('services.index');
        Route::put('/services/{service}', [MasterServiceController::class, 'update'])->name('services.update');

        /*
         * Self-service profile. The PUT route is real, but the frontend submits
         * it as POST + _method=put (forceFormData): PHP only parses a multipart
         * body on POST, so a genuine PUT would arrive with every field missing.
         */
        Route::get('/profile', [MasterProfileController::class, 'edit'])->name('profile.edit');
        Route::put('/profile', [MasterProfileController::class, 'update'])->name('profile.update');

        /*
         * Own showcase works. The parameter is renamed to `{item}` so the model
         * binding and the controller signatures read the same in both panels.
         * toggle is registered before the resource purely for readability —
         * PATCH /portfolio/{item} and PATCH /portfolio/{item}/toggle cannot
         * collide.
         */
        Route::patch('portfolio/{item}/toggle', [MasterPortfolioController::class, 'toggle'])
            ->name('portfolio.toggle');
        Route::resource('portfolio', MasterPortfolioController::class)
            ->parameters(['portfolio' => 'item'])
            ->except(['show']);

        Route::get('/appointments', [MasterAppointmentController::class, 'index'])->name('appointments.index');
        Route::patch('/appointments/{appointment}/confirm', [MasterAppointmentController::class, 'confirm'])
            ->name('appointments.confirm');
        Route::patch('/appointments/{appointment}/reject', [MasterAppointmentController::class, 'reject'])
            ->name('appointments.reject');
        Route::patch('/appointments/{appointment}/status', [MasterAppointmentController::class, 'status'])
            ->name('appointments.status');
    });

/*
|--------------------------------------------------------------------------
| Admin area
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Masters: the "create" screen is backed by MasterController@create.
        Route::get('/masters', [AdminMasterController::class, 'index'])->name('masters.index');
        Route::get('/masters/create', [AdminMasterController::class, 'create'])->name('masters.create');
        Route::post('/masters', [AdminMasterController::class, 'store'])->name('masters.store');
        Route::get('/masters/{master}/edit', [AdminMasterController::class, 'edit'])->name('masters.edit');
        Route::put('/masters/{master}', [AdminMasterController::class, 'update'])->name('masters.update');
        Route::delete('/masters/{master}', [AdminMasterController::class, 'destroy'])->name('masters.destroy');

        Route::get('/services', [AdminServiceController::class, 'index'])->name('services.index');
        Route::get('/services/create', [AdminServiceController::class, 'create'])->name('services.create');
        Route::post('/services', [AdminServiceController::class, 'store'])->name('services.store');
        Route::get('/services/{service}/edit', [AdminServiceController::class, 'edit'])->name('services.edit');
        Route::put('/services/{service}', [AdminServiceController::class, 'update'])->name('services.update');
        Route::delete('/services/{service}', [AdminServiceController::class, 'destroy'])->name('services.destroy');

        Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::get('/categories/create', [AdminCategoryController::class, 'create'])->name('categories.create');
        Route::post('/categories', [AdminCategoryController::class, 'store'])->name('categories.store');
        Route::get('/categories/{category}/edit', [AdminCategoryController::class, 'edit'])->name('categories.edit');
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])->name('categories.destroy');

        /*
         * Portfolio: full CRUD plus a publish toggle. `{item}` replaces the
         * default `{portfolio}` parameter so the controller signature is the
         * same in the admin and the master panel.
         */
        Route::patch('/portfolio/{item}/toggle', [AdminPortfolioItemController::class, 'toggle'])
            ->name('portfolio.toggle');
        Route::resource('portfolio', AdminPortfolioItemController::class)
            ->parameters(['portfolio' => 'item'])
            ->except(['show']);

        // Appointments: index, show and status update only.
        Route::get('/appointments', [AdminAppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/appointments/{appointment}', [AdminAppointmentController::class, 'show'])->name('appointments.show');
        Route::patch('/appointments/{appointment}', [AdminAppointmentController::class, 'update'])->name('appointments.update');

        // Reviews: index, approve, unapprove, destroy.
        Route::get('/reviews', [AdminReviewController::class, 'index'])->name('reviews.index');
        Route::patch('/reviews/{review}/approve', [AdminReviewController::class, 'approve'])->name('reviews.approve');
        Route::patch('/reviews/{review}/unapprove', [AdminReviewController::class, 'unapprove'])->name('reviews.unapprove');
        Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy'])->name('reviews.destroy');

        // Settings: edit + update only.
        Route::get('/settings', [AdminSettingController::class, 'edit'])->name('settings.edit');
        Route::put('/settings', [AdminSettingController::class, 'update'])->name('settings.update');

        Route::get('/pages', [AdminPageController::class, 'index'])->name('pages.index');
        Route::get('/pages/create', [AdminPageController::class, 'create'])->name('pages.create');
        Route::post('/pages', [AdminPageController::class, 'store'])->name('pages.store');
        Route::get('/pages/{page}/edit', [AdminPageController::class, 'edit'])->name('pages.edit');
        Route::put('/pages/{page}', [AdminPageController::class, 'update'])->name('pages.update');
        Route::delete('/pages/{page}', [AdminPageController::class, 'destroy'])->name('pages.destroy');

        // Users: index, role update, destroy.
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    });

/*
|--------------------------------------------------------------------------
| CMS pages — must stay last
|--------------------------------------------------------------------------
| /about and /contacts are hard-wired above; every other page created in the
| admin panel was unreachable because nothing served its slug, even though the
| admin list links to /{slug}. Declared last so it only matches a path no other
| route claimed, and PageController aborts 404 when no published page matches.
*/
Route::get('/{slug}', [PageController::class, 'show'])->name('pages.show');
