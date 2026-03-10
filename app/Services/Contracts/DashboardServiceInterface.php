<?php

namespace App\Services\Contracts;

interface DashboardServiceInterface
{
    public function metrics(): array;

    public function dashboardData(): array;
}

