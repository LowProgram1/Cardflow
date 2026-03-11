<?php

namespace App\Repositories\Contracts;

use App\Models\Expense;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ExpenseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15, ?int $userId = null): LengthAwarePaginator;

    public function create(array $attributes): Expense;

    public function update(Expense $expense, array $attributes): Expense;

    public function delete(Expense $expense): void;

    public function recentWithRelations(int $limit = 10, ?int $userId = null): Collection;

    public function totalByType(?int $userId = null, ?int $cardId = null, ?string $type = null): float;

    /**
     * Get all installment expenses with relations for dashboard summary.
     *
     * @param  int|null  $userId  When set, scope to this user.
     * @return \Illuminate\Support\Collection<Expense>
     */
    public function getInstallmentExpenses(?int $userId = null): Collection;

    /**
     * Get all full-payment expenses (type=expense, payment_type=full) for dashboard.
     *
     * @param  int|null  $userId  When set, scope to this user.
     * @return \Illuminate\Support\Collection<Expense>
     */
    public function getFullPaymentExpenses(?int $userId = null): Collection;

    /**
     * Sum of "paid" portions: for installment (paid_months count × monthly_amortization) + for full (amount if paid).
     * Used to reduce outstanding balance.
     *
     * @param  int|null  $userId  When set, scope to this user.
     */
    public function getTotalPaidPortion(?int $userId = null): float;
}

