<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\VerifyRegistrationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CardTypeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseTypeController;
use App\Http\Controllers\PaymentTermController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\FeatureController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\UserFeatureController;
use App\Http\Controllers\PartTimeController;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:auth')->name('login.store');
    Route::get('/forgot-password', [ForgotPasswordController::class, 'show'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email')->middleware('throttle:auth');
    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'show'])->name('password.reset');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->name('password.update')->middleware('throttle:auth-sensitive');
    Route::get('/register', [RegisterController::class, 'show'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->name('register.store')->middleware('throttle:auth');
    Route::get('/register/verify/{user}', [VerifyRegistrationController::class, 'show'])->name('register.verify')->middleware('signed');
});

Route::middleware('auth')->group(function () {
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// Admin-only routes: redirect non-admins to dashboard
Route::prefix('admin')->middleware('is.admin')->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'))->name('admin.index');
    // Add further admin-only routes here, e.g. Route::get('/reports', ...);
});

Route::middleware('feature:salary_monitoring')->prefix('salary')->name('salary.')->group(function () {
    Route::get('/', [SalaryController::class, 'index'])->name('index');
    Route::get('/export-pdf', [SalaryController::class, 'exportPdf'])->name('export-pdf')->middleware('throttle:exports');
    Route::post('/classes', [SalaryController::class, 'storeClass'])->name('classes.store');
    Route::put('/classes/{salary_class}', [SalaryController::class, 'updateClass'])->name('classes.update');
    Route::delete('/classes/{salary_class}', [SalaryController::class, 'destroyClass'])->name('classes.destroy');
    Route::post('/rates', [SalaryController::class, 'storeRate'])->name('rates.store');
    Route::put('/rates/{salary_rate}', [SalaryController::class, 'updateRate'])->name('rates.update');
    Route::delete('/rates/{salary_rate}', [SalaryController::class, 'destroyRate'])->name('rates.destroy');
    Route::post('/payments', [SalaryController::class, 'storePayment'])->name('payments.store');
    Route::put('/payments/{salary_payment}', [SalaryController::class, 'updatePayment'])->name('payments.update');
    Route::delete('/payments/{salary_payment}', [SalaryController::class, 'destroyPayment'])->name('payments.destroy');
    Route::post('/part-time-payments', [SalaryController::class, 'storePartTimePayment'])->name('part-time-payments.store');
    Route::put('/part-time-payments/{part_time_payment}', [SalaryController::class, 'updatePartTimePayment'])->name('part-time-payments.update');
    Route::delete('/part-time-payments/{part_time_payment}', [SalaryController::class, 'destroyPartTimePayment'])->name('part-time-payments.destroy');
});

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

Route::get('features', [FeatureController::class, 'index'])->name('features.index');
Route::get('users/{user}/features', [UserFeatureController::class, 'show'])->name('users.features.show');
Route::put('users/{user}/features', [UserFeatureController::class, 'update'])->name('users.features.update');

Route::resource('users', UserController::class)->except(['show'])->middleware('admin');
Route::resource('part-times', PartTimeController::class)->except(['show', 'create', 'edit']);
Route::middleware('feature:expense_tracker')->group(function () {
    Route::resource('expenses', ExpenseController::class)->except(['show']);
    Route::post('expenses/{expense}/paid-month', [ExpenseController::class, 'togglePaidMonth'])->name('expenses.toggle-paid-month');
});
Route::middleware('feature:cards')->group(function () {
    Route::resource('cards', CardController::class)->except(['show']);
    Route::get('cards/{card}/transactions', [CardController::class, 'transactions'])->name('cards.transactions');
    Route::get('cards/{card}/statement-months', [CardController::class, 'statementMonths'])->name('cards.statement-months');
    Route::get('cards/{card}/statement', [CardController::class, 'statement'])->name('cards.statement');
    Route::get('cards/{card}/statement-pdf', [CardController::class, 'statementPdf'])->name('cards.statement-pdf');
});
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

