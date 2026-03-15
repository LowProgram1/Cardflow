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
            ->orderBy('id');

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
            ->orderBy('id');

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->get();
    }

    public function allActiveForExpenseLinking(): Collection
    {
        return Card::query()
            ->with('user:id,name')
            ->where('is_active', true)
            ->orderBy('user_id')
            ->orderBy('id')
            ->get();
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

    /**
     * Payment history for a card within a date range: type=payment expenses by transaction_date,
     * and type=expense with last_paid_at in range (payment toward that expense).
     *
     * @return array<int, array{date: string, description: string, amount: float}>
     */
    public function getPaymentHistoryForCard(Card $card, Carbon $from, Carbon $to): array
    {
        $fromStr = $from->toDateString();
        $toStr = $to->toDateString();
        $rows = [];

        $paymentExpenses = Expense::query()
            ->where('card_id', $card->id)
            ->where('type', 'payment')
            ->where('transaction_date', '>=', $fromStr)
            ->where('transaction_date', '<=', $toStr)
            ->with(['expenseType'])
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get();

        foreach ($paymentExpenses as $e) {
            $rows[] = [
                'date' => $e->transaction_date?->format('M j, Y') ?? '—',
                'description' => $e->description ?? $e->expenseType?->name ?? 'Payment',
                'amount' => (float) $e->amount,
            ];
        }

        $expensesWithPaidInPeriod = Expense::query()
            ->where('card_id', $card->id)
            ->where('type', 'expense')
            ->whereNotNull('last_paid_at')
            ->whereDate('last_paid_at', '>=', $fromStr)
            ->whereDate('last_paid_at', '<=', $toStr)
            ->with(['expenseType'])
            ->orderBy('last_paid_at')
            ->orderBy('id')
            ->get();

        foreach ($expensesWithPaidInPeriod as $e) {
            $desc = $e->description ?? $e->expenseType?->name ?? 'Payment';
            $amount = ($e->payment_type ?? 'full') === 'installment'
                ? (float) ($e->monthly_amortization ?? 0)
                : (float) $e->amount;
            if ($amount <= 0) {
                continue;
            }
            $rows[] = [
                'date' => $e->last_paid_at?->format('M j, Y') ?? '—',
                'description' => 'Payment — ' . $desc,
                'amount' => $amount,
            ];
        }

        usort($rows, fn ($a, $b) => strcmp($a['date'], $b['date']));

        return array_values($rows);
    }
}

