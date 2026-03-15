<?php

namespace App\Services\Contracts;

interface DashboardServiceInterface
{
    /** @param  int|null  $userId  When set, scope all data to this user (for non-admin). */
    public function metrics(?int $userId = null): array;

    /**
     * @param  int|null  $userId  When set, scope metrics/expenses to this user (for non-admin).
     * @param  int|null  $cardsUserId  When set (e.g. when admin), scope cards list to this user only for data privacy.
     */
    public function dashboardData(?int $userId = null, ?int $cardsUserId = null): array;
}

