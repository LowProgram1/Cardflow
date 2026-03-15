<?php

namespace App\Providers;

use App\Repositories\Contracts\CardRepositoryInterface;
use App\Repositories\Contracts\ExpenseRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\CardRepository;
use App\Repositories\Eloquent\ExpenseRepository;
use App\Repositories\Eloquent\UserRepository;
use App\Services\CardService;
use App\Services\Contracts\CardServiceInterface;
use App\Services\Contracts\DashboardServiceInterface;
use App\Services\Contracts\ExpenseServiceInterface;
use App\Services\Contracts\UserServiceInterface;
use App\Services\DashboardService;
use App\Services\ExpenseService;
use App\Services\UserService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(CardRepositoryInterface::class, CardRepository::class);
        $this->app->bind(ExpenseRepositoryInterface::class, ExpenseRepository::class);

        $this->app->bind(UserServiceInterface::class, UserService::class);
        $this->app->bind(CardServiceInterface::class, CardService::class);
        $this->app->bind(ExpenseServiceInterface::class, ExpenseService::class);
        $this->app->bind(DashboardServiceInterface::class, DashboardService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Password::defaults(function () {
            return Password::min(12)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols();
        });

        // Auth rate limit: 5 attempts per minute per IP (login, register, forgot password)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Stricter limit for password reset / sensitive auth
        RateLimiter::for('auth-sensitive', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        // General web: 120 requests per minute per user (or IP for guests) to reduce abuse
        RateLimiter::for('web', function (Request $request) {
            $key = $request->user()?->id ?? $request->ip();

            return Limit::perMinute(120)->by((string) $key);
        });

        // Export / heavy actions: 10 per minute per user
        RateLimiter::for('exports', function (Request $request) {
            $key = $request->user()?->id ?? $request->ip();

            return Limit::perMinute(10)->by((string) $key);
        });
    }
}
