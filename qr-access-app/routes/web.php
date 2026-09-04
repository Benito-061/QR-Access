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

Route::get('/', function () {
    try {
        if (session()->has('invitee_guest_id')) return redirect()->route('invitee.gift');
        if (auth()->check()) return redirect()->route('dashboard');
    } catch (Throwable $e) { report($e); }
    return view('welcome');
})->name('welcome');

Route::middleware('invitee.guest')->group(function () {
    Route::get('/invite/connexion', [GuestInviteeAuthController::class, 'create'])->name('invitee.login');
    Route::post('/invite/connexion', [GuestInviteeAuthController::class, 'store'])->name('invitee.login.store');
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
    Route::view('/rapport-downloads', 'pages.dashboard', ['activeTab' => 'downloads', 'pageTitle' => 'Rapport de téléchargements'])->name('downloads');
    Route::view('/corbeille', 'pages.dashboard', ['activeTab' => 'trash', 'pageTitle' => 'Corbeille'])->name('trash');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
