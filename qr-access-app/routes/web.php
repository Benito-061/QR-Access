<?php

use App\Http\Controllers\CeremonyManagementPageController;
use App\Http\Controllers\CeremonyPageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryPageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VerifyPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
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
