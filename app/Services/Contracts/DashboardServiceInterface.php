<?php

namespace App\Services\Contracts;

interface DashboardServiceInterface
{
    /** @param  int|null  $userId  When set, scope all data to this user (for non-admin). */
    public function metrics(?int $userId = null): array;

    /** @param  int|null  $userId  When set, scope all data to this user (for non-admin). */
    public function dashboardData(?int $userId = null): array;
}

