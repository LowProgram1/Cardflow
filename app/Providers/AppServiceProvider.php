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
use Illuminate\Support\ServiceProvider;

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
        //
    }
}
