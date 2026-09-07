<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ImportExportController;
use App\Http\Controllers\Api\WebsiteController;
use Illuminate\Support\Facades\Route;

// Autenticación (JWT)
Route::post('auth/register', [AuthController::class, 'register'])->name('auth.register');
Route::post('auth/login', [AuthController::class, 'login'])->name('auth.login');

Route::middleware('auth:api')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::post('auth/refresh', [AuthController::class, 'refresh'])->name('auth.refresh');
    Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');

    Route::apiResource('websites', WebsiteController::class);
    Route::patch('websites/{website}/favorite', [WebsiteController::class, 'toggleFavorite'])
        ->name('websites.favorite');
    Route::post('websites/preview-url', [ImportExportController::class, 'preview'])
        ->name('websites.preview-url');
    Route::get('websites/export/{format}', [ImportExportController::class, 'export'])
        ->whereIn('format', ['csv', 'json'])
        ->name('websites.export');
    Route::post('websites/import', [ImportExportController::class, 'import'])
        ->name('websites.import');

    Route::apiResource('categories', CategoryController::class)
        ->only(['index', 'store', 'destroy']);

    Route::get('dashboard/statistics', [DashboardController::class, 'statistics'])
        ->name('dashboard.statistics');
});