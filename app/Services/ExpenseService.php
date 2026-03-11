<?php

namespace App\Services;

use App\Models\Expense;
use App\Repositories\Contracts\ExpenseRepositoryInterface;
use App\Services\Contracts\ExpenseServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ExpenseService implements ExpenseServiceInterface
{
    public function __construct(
        private readonly ExpenseRepositoryInterface $expenses,
    ) {
    }

    public function paginateWithRelations(int $perPage = 15, ?int $userId = null): LengthAwarePaginator
    {
        return $this->expenses->paginateWithRelations($perPage, $userId);
    }

    public function create(array $attributes): Expense
    {
        return DB::transaction(fn () => $this->expenses->create($attributes));
    }

    public function update(Expense $expense, array $attributes): Expense
    {
        return DB::transaction(fn () => $this->expenses->update($expense, $attributes));
    }

    public function delete(Expense $expense): void
    {
        DB::transaction(fn () => $this->expenses->delete($expense));
    }

    public function recentWithRelations(int $limit = 10, ?int $userId = null): Collection
    {
        return $this->expenses->recentWithRelations($limit, $userId);
    }
}

