<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CardTypeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseTypeController;
use App\Http\Controllers\PaymentTermController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect()->route('dashboard');
})->name('logout');

Route::get('/profile', function () {
    return redirect()->route('settings.index', ['section' => 'profile']);
})->name('profile');

Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

Route::resource('users', UserController::class)->except(['show']);
Route::resource('cards', CardController::class)->except(['show']);
Route::get('/card-types', fn () => redirect()->route('settings.index', ['section' => 'card-types']))->name('card-types.index');
Route::resource('card-types', CardTypeController::class)->only(['store', 'update', 'destroy']);
Route::get('/expense-types', fn () => redirect()->route('settings.index', ['section' => 'expense-types']))->name('expense-types.index');
Route::resource('expense-types', ExpenseTypeController::class)->only(['store', 'update', 'destroy']);
Route::get('/payment-terms', fn () => redirect()->route('settings.index', ['section' => 'payment-terms']))->name('payment-terms.index');
Route::resource('payment-terms', PaymentTermController::class)->only(['store', 'update', 'destroy']);
Route::resource('expenses', ExpenseController::class)->except(['show']);
Route::post('expenses/{expense}/paid-month', [ExpenseController::class, 'togglePaidMonth'])->name('expenses.toggle-paid-month');

Route::fallback(function () {
    return redirect()->route('dashboard');
});

