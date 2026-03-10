<?php

namespace App\Repositories\Contracts;

use App\Models\Expense;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ExpenseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator;

    public function create(array $attributes): Expense;

    public function update(Expense $expense, array $attributes): Expense;

    public function delete(Expense $expense): void;

    public function recentWithRelations(int $limit = 10): Collection;

    public function totalByType(?int $userId = null, ?int $cardId = null, ?string $type = null): float;

    /**
     * Get all installment expenses with relations for dashboard summary.
     *
     * @return \Illuminate\Support\Collection<Expense>
     */
    public function getInstallmentExpenses(): Collection;

    /**
     * Get all full-payment expenses (type=expense, payment_type=full) for dashboard.
     *
     * @return \Illuminate\Support\Collection<Expense>
     */
    public function getFullPaymentExpenses(): Collection;

    /**
     * Sum of "paid" portions: for installment (paid_months count × monthly_amortization) + for full (amount if paid).
     * Used to reduce outstanding balance.
     */
    public function getTotalPaidPortion(): float;
}

