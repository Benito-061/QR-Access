<?php

use App\Http\Controllers\Api\DataSyncController;
use App\Http\Controllers\Api\ToolsApiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/sync', [DataSyncController::class, 'show']);
    Route::post('/sync', [DataSyncController::class, 'store']);
    Route::get('/downloads', [ToolsApiController::class, 'downloads']);
    Route::post('/downloads', [ToolsApiController::class, 'recordDownload']);
    Route::get('/trash', [ToolsApiController::class, 'trash']);
    Route::post('/trash/{type}/{id}/restore', [ToolsApiController::class, 'restore']);
    Route::delete('/trash/{type}/{id}', [ToolsApiController::class, 'destroyTrash']);
});
