<?php

namespace App\Services;

use App\Models\Card;
use App\Repositories\Contracts\CardRepositoryInterface;
use App\Services\Contracts\CardServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CardService implements CardServiceInterface
{
    public function __construct(
        private readonly CardRepositoryInterface $cards,
    ) {
    }

    public function paginate(int $perPage = 15, ?int $userId = null): LengthAwarePaginator
    {
        return $this->cards->paginate($perPage, $userId);
    }

    public function allActive(?int $userId = null): Collection
    {
        return $this->cards->allActive($userId);
    }

    public function allActiveForExpenseLinking(): Collection
    {
        return $this->cards->allActiveForExpenseLinking();
    }

    public function create(array $attributes): Card
    {
        return DB::transaction(fn () => $this->cards->create($attributes));
    }

    public function update(Card $card, array $attributes): Card
    {
        return DB::transaction(fn () => $this->cards->update($card, $attributes));
    }

    public function delete(Card $card): void
    {
        DB::transaction(fn () => $this->cards->delete($card));
    }

    public function getTransactionsForCard(Card $card, ?\Carbon\Carbon $from = null, ?\Carbon\Carbon $to = null): \Illuminate\Support\Collection
    {
        return $this->cards->getTransactionsForCard($card, $from, $to);
    }

    /** @return array<int, array{value: string, label: string}> */
    public function getStatementMonthsForCard(Card $card): array
    {
        return $this->cards->getStatementMonthsForCard($card);
    }

    /** @return array<int, array{date: string, description: string, amount: float}> */
    public function getPaymentHistoryForCard(Card $card, \Carbon\Carbon $from, \Carbon\Carbon $to): array
    {
        return $this->cards->getPaymentHistoryForCard($card, $from, $to);
    }
}

