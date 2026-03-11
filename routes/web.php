<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CardTypeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseTypeController;
use App\Http\Controllers\PaymentTermController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
});

Route::middleware('auth')->group(function () {
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::post('/logout', function () {
    $inactivity = request()->boolean('inactivity') || request()->input('reason') === 'inactivity';
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    if ($inactivity) {
        return redirect()->route('login')->with('flash', ['type' => 'info', 'message' => 'You were logged out due to inactivity.']);
    }
    return redirect()->route('login');
})->name('logout');

Route::get('/profile', function () {
    return redirect()->route('settings.index', ['section' => 'profile']);
})->name('profile');

Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
Route::post('/settings/favicon', [SettingsController::class, 'updateFavicon'])->name('settings.favicon')->middleware('admin');

Route::resource('users', UserController::class)->except(['show'])->middleware('admin');
Route::resource('expenses', ExpenseController::class)->except(['show'])->middleware('admin');
Route::post('expenses/{expense}/paid-month', [ExpenseController::class, 'togglePaidMonth'])->name('expenses.toggle-paid-month')->middleware('admin');
Route::resource('cards', CardController::class)->except(['show']);
Route::get('cards/{card}/transactions', [CardController::class, 'transactions'])->name('cards.transactions');
Route::get('cards/{card}/statement-months', [CardController::class, 'statementMonths'])->name('cards.statement-months');
Route::get('cards/{card}/statement', [CardController::class, 'statement'])->name('cards.statement');
Route::get('/card-types', fn () => redirect()->route('settings.index', ['section' => 'card-types']))->name('card-types.index');
Route::resource('card-types', CardTypeController::class)->only(['store', 'update', 'destroy']);
Route::get('/expense-types', fn () => redirect()->route('settings.index', ['section' => 'expense-types']))->name('expense-types.index');
Route::resource('expense-types', ExpenseTypeController::class)->only(['store', 'update', 'destroy']);
Route::get('/payment-terms', fn () => redirect()->route('settings.index', ['section' => 'payment-terms']))->name('payment-terms.index');
Route::resource('payment-terms', PaymentTermController::class)->only(['store', 'update', 'destroy']);

Route::fallback(function () {
    return redirect()->route('dashboard');
});
});

