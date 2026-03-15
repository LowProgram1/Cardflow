<?php

namespace App\Repositories\Contracts;

use App\Models\Card;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface CardRepositoryInterface
{
    public function paginate(int $perPage = 15, ?int $userId = null): LengthAwarePaginator;

    public function allActive(?int $userId = null): Collection;

    /**
     * All active cards with user loaded, for admin expense linking only.
     * Returns minimal data (id, user_id, user name, last_four) for dropdown labels.
     *
     * @return Collection<int, Card>
     */
    public function allActiveForExpenseLinking(): Collection;

    public function create(array $attributes): Card;

    public function update(Card $card, array $attributes): Card;

    public function delete(Card $card): void;

    public function countActive(): int;

    public function countActiveForUser(int $userId): int;

    /** @return \Illuminate\Support\Collection<int, \App\Models\Expense> */
    public function getTransactionsForCard(Card $card, ?\Carbon\Carbon $from = null, ?\Carbon\Carbon $to = null): Collection;

    /** @return array<int, array{value: string, label: string}> */
    public function getStatementMonthsForCard(Card $card): array;

    /**
     * Payment history for a card within a date range (for statement).
     *
     * @return array<int, array{date: string, description: string, amount: float}>
     */
    public function getPaymentHistoryForCard(Card $card, \Carbon\Carbon $from, \Carbon\Carbon $to): array;
}

