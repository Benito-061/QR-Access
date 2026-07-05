<?php

use App\Http\Controllers\CeremonyManagementPageController;
use App\Http\Controllers\CeremonyPageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestGiftController;
use App\Http\Controllers\GuestInviteeAuthController;
use App\Http\Controllers\HistoryPageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VerifyPageController;
use Illuminate\Support\Facades\Route;

/** Diagnostic temporaire — supprimer après résolution des problèmes serveur */
Route::get('/server-check', function () {
    $lines = [
        '=== QR Access — Diagnostic ===',
        'Date: ' . now()->toIso8601String(),
        'PHP: ' . PHP_VERSION,
        'SAPI: ' . php_sapi_name(),
        'base_path: ' . base_path(),
        'public_path: ' . public_path(),
        'storage_path: ' . storage_path(),
        'storage writable: ' . (is_writable(storage_path()) ? 'oui' : 'NON'),
        'sessions dir writable: ' . (is_writable(storage_path('framework/sessions')) ? 'oui' : 'NON'),
        'APP_ENV: ' . config('app.env'),
        'APP_DEBUG: ' . (config('app.debug') ? 'true' : 'false'),
        'APP_URL: ' . config('app.url'),
        'SESSION_DRIVER: ' . config('session.driver'),
        'CACHE_STORE: ' . config('cache.default'),
        'DB connection: ' . config('database.default'),
    ];

    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $lines[] = 'DB: connecté';
    } catch (Throwable $e) {
        $lines[] = 'DB ERREUR: ' . $e->getMessage();
    }

    $lines[] = '';
    $lines[] = '=== Fin ===';

    return response(implode("\n", $lines), 200, ['Content-Type' => 'text/plain; charset=utf-8']);
});

Route::get('/', function () {
    if (session()->has('invitee_guest_id')) {
        return redirect()->route('invitee.gift');
    }

    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return view('welcome');
})->name('welcome');

Route::middleware('invitee.guest')->group(function () {
    Route::get('/invite/connexion', [GuestInviteeAuthController::class, 'create'])
        ->name('invitee.login');
    Route::post('/invite/connexion', [GuestInviteeAuthController::class, 'store'])
        ->name('invitee.login.store');
});

Route::middleware('invitee')->prefix('invite')->name('invitee.')->group(function () {
    Route::get('/cadeau', [GuestGiftController::class, 'index'])->name('gift');
    Route::post('/cadeau', [GuestGiftController::class, 'store'])->name('gift.store');
    Route::post('/deconnexion', [GuestInviteeAuthController::class, 'destroy'])->name('logout');
});

Route::middleware(['auth', 'verified', 'invitee.block_admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/ceremonie', [CeremonyPageController::class, 'index'])->name('ceremonie');
    Route::get('/verify', [VerifyPageController::class, 'index'])->name('verify');
    Route::get('/history', [HistoryPageController::class, 'index'])->name('history');
    Route::get('/gestion-ceremonies', [CeremonyManagementPageController::class, 'index'])->name('gestion-ceremonies');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
