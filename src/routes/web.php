<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DailyReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route(auth()->check() ? 'reports.index' : 'login'));

Route::view('/bingo', 'bingo')->name('bingo');

Route::middleware('guest')->group(function () {
    Route::view('/login', 'auth.login')->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::view('/register', 'auth.register')->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::resource('reports', DailyReportController::class);
    Route::post('/reports/{report}/comments', [DailyReportController::class, 'comment'])
        ->middleware('throttle:30,1')->name('reports.comments.store');
});
