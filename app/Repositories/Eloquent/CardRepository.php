<?php

namespace App\Repositories\Eloquent;

use App\Models\Card;
use App\Models\Expense;
use App\Repositories\Contracts\CardRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CardRepository implements CardRepositoryInterface
{
    public function paginate(int $perPage = 15, ?int $userId = null): LengthAwarePaginator
    {
        $query = Card::query()
            ->with(['cardType'])
            ->withCount('expenses')
            ->orderBy('name');

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function allActive(?int $userId = null): Collection
    {
        $query = Card::query()
            ->with(['cardType'])
            ->where('is_active', true)
            ->orderBy('name');

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->get();
    }

    public function create(array $attributes): Card
    {
        return Card::query()->create($attributes);
    }

    public function update(Card $card, array $attributes): Card
    {
        $card->fill($attributes);
        $card->save();

        return $card;
    }

    public function delete(Card $card): void
    {
        $card->delete();
    }

    public function countActive(): int
    {
        return Card::query()->where('is_active', true)->count();
    }

    public function countActiveForUser(int $userId): int
    {
        return Card::query()->where('is_active', true)->where('user_id', $userId)->count();
    }

    public function getTransactionsForCard(Card $card, ?Carbon $from = null, ?Carbon $to = null): Collection
    {
        $query = Expense::query()
            ->where('card_id', $card->id)
            ->with(['expenseType', 'user'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id');

        if ($from !== null) {
            $query->where('transaction_date', '>=', $from->toDateString());
        }
        if ($to !== null) {
            $query->where('transaction_date', '<=', $to->toDateString());
        }

        return $query->get();
    }

    public function getStatementMonthsForCard(Card $card): array
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            $months = Expense::query()
                ->where('card_id', $card->id)
                ->selectRaw('DISTINCT strftime("%Y-%m", transaction_date) as yyyy_mm')
                ->orderByDesc('yyyy_mm')
                ->pluck('yyyy_mm')
                ->filter()
                ->values();
        } else {
            $months = Expense::query()
                ->where('card_id', $card->id)
                ->selectRaw('DISTINCT DATE_FORMAT(transaction_date, "%Y-%m") as yyyy_mm')
                ->orderByDesc('yyyy_mm')
                ->pluck('yyyy_mm')
                ->filter()
                ->values();
        }

        if ($months->isEmpty()) {
            return [];
        }

        return $months->map(function ($yyyyMm) {
            $parts = explode('-', $yyyyMm);
            $year = (int) ($parts[0] ?? 0);
            $month = (int) ($parts[1] ?? 0);
            $date = Carbon::createFromDate($year, $month, 1);

            return [
                'value' => $yyyyMm,
                'label' => $date->format('F Y'),
            ];
        })->all();
    }
}

