<?php

namespace App\Services\Contracts;

use App\Models\Expense;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ExpenseServiceInterface
{
    public function paginateWithRelations(int $perPage = 15, ?int $userId = null, bool $adminCreatedOnly = false, ?array $adminIds = null): LengthAwarePaginator;

    public function create(array $attributes): Expense;

    public function update(Expense $expense, array $attributes): Expense;

    public function delete(Expense $expense): void;

    public function recentWithRelations(int $limit = 10, ?int $userId = null): Collection;
}

