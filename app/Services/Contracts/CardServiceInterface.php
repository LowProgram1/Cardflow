<?php

namespace App\Services\Contracts;

use App\Models\Card;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface CardServiceInterface
{
    public function paginate(int $perPage = 15, ?int $userId = null): LengthAwarePaginator;

    public function allActive(?int $userId = null): Collection;

    /** All active cards for admin expense linking (minimal data: id, user, last_four). */
    public function allActiveForExpenseLinking(): Collection;

    public function create(array $attributes): Card;

    public function update(Card $card, array $attributes): Card;

    public function delete(Card $card): void;

    /** @return \Illuminate\Support\Collection<int, \App\Models\Expense> */
    public function getTransactionsForCard(Card $card, ?\Carbon\Carbon $from = null, ?\Carbon\Carbon $to = null): Collection;

    /** @return array<int, array{value: string, label: string}> */
    public function getStatementMonthsForCard(Card $card): array;

    /** @return array<int, array{date: string, description: string, amount: float}> */
    public function getPaymentHistoryForCard(Card $card, \Carbon\Carbon $from, \Carbon\Carbon $to): array;
}

