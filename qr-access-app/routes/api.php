<?php

use App\Http\Controllers\Api\DataSyncController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/sync', [DataSyncController::class, 'show']);
    Route::post('/sync', [DataSyncController::class, 'store']);
});
