<?php

namespace App\Repositories\Eloquent;

use App\Helpers\CurrencyHelper;
use App\Helpers\InstallmentTermHelper;
use App\Models\Card;
use App\Models\Expense;
use App\Services\MonthlyPaymentCalculator;
use App\Repositories\Contracts\CardRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

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

    public function allActiveForExpenseLinking(bool $adminOwnedOnly = true): Collection
    {
        $query = Card::query()
            ->with('user:id,name')
            ->where('is_active', true)
            ->orderBy('user_id')
            ->orderBy('id')
            ;

        if ($adminOwnedOnly) {
            $query->whereHas('user', function ($q) {
                $q->where('role', 'admin')->orWhereNull('role');
            });
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
        // When month-scoped, return obligations for the requested statement month.
        // This ensures the UI shows installments for months that may not yet have any recorded transactions.
        if ($from !== null && $to !== null) {
            /** @var MonthlyPaymentCalculator $calculator */
            $calculator = app(MonthlyPaymentCalculator::class);

            $requestedStatementMonth = $to->copy()->format('Y-m');
            $requestedStart = Carbon::createFromFormat('Y-m', $requestedStatementMonth)->startOfMonth();

            $rows = collect();

            $installmentExpenses = Expense::query()
                ->where('card_id', $card->id)
                ->where('type', 'expense')
                ->where('payment_type', 'installment')
                ->with(['paymentTerm', 'expenseType'])
                ->orderByDesc('transaction_date')
                ->orderByDesc('id')
                ->get();

            foreach ($installmentExpenses as $expense) {
                if (! $expense->transaction_date) {
                    continue;
                }
                if (! $expense->paymentTerm) {
                    continue;
                }

                $start = Carbon::parse($expense->transaction_date)->startOfMonth();
                $termMonths = InstallmentTermHelper::resolveInstallmentTermMonths($expense);
                if ($termMonths <= 0) {
                    continue;
                }

                $startKey = ((int) $start->format('Y')) * 12 + (int) $start->format('n');
                $reqKey = ((int) $requestedStart->format('Y')) * 12 + (int) $requestedStart->format('n');
                $diff = $reqKey - $startKey;
                $monthNum = $diff + 1;

                if ($monthNum < 1 || $monthNum > $termMonths) {
                    continue;
                }

                $req = $calculator->installmentRequirementForMonthNumber($expense, $monthNum);
                $balance = (float) ($req['balance'] ?? 0.0);
                $dueAmount = (float) ($req['amount_required'] ?? 0.0);
                $paidAmount = (float) ($req['amount_paid'] ?? 0.0);
                $status = $balance <= 0.0 ? 'paid' : 'unpaid';

                $descBase = $expense->description ?? $expense->expenseType?->name ?? 'Installment';
                $rows->push([
                    'id' => 'installment-ob-' . $expense->id . '-m' . $monthNum,
                    'expense_id' => $expense->id,
                    'month_number' => $monthNum,
                    'description' => $descBase . ' (month ' . $monthNum . ')',
                    'amount' => $balance,
                    'formatted_amount' => CurrencyHelper::formatCurrency($balance),
                    'due_amount' => $dueAmount,
                    'formatted_due_amount' => CurrencyHelper::formatCurrency($dueAmount),
                    'paid_amount' => $paidAmount,
                    'formatted_paid_amount' => CurrencyHelper::formatCurrency($paidAmount),
                    'status' => $status,
                    'type' => 'installment',
                    'transaction_date' => $requestedStart->toDateString(),
                    'expense_type_name' => $expense->expenseType?->name,
                    'user_name' => null,
                ]);
            }

            $fullExpenses = Expense::query()
                ->where('card_id', $card->id)
                ->where('type', 'expense')
                ->where('payment_type', 'full')
                ->with(['expenseType'])
                ->orderByDesc('transaction_date')
                ->orderByDesc('id')
                ->get();

            foreach ($fullExpenses as $expense) {
                if (! $expense->transaction_date) {
                    continue;
                }

                $start = Carbon::parse($expense->transaction_date)->startOfMonth();
                $startKey = ((int) $start->format('Y')) * 12 + (int) $start->format('n');
                $reqKey = ((int) $requestedStart->format('Y')) * 12 + (int) $requestedStart->format('n');
                $diff = $reqKey - $startKey;
                $monthNum = $diff + 1;

                // Full payment belongs only to month 1 (installment semantics)
                if ($monthNum !== 1) {
                    continue;
                }

                $isPaid = in_array(1, $expense->paid_months ?? [], true);
                $balance = $isPaid ? 0.0 : (float) ($expense->amount ?? 0.0);
                $dueAmount = (float) ($expense->amount ?? 0.0);
                $paidAmount = $isPaid ? $dueAmount : 0.0;
                $status = $isPaid ? 'paid' : 'unpaid';

                $descBase = $expense->description ?? $expense->expenseType?->name ?? 'Full payment';
                $rows->push([
                    'id' => 'full-ob-' . $expense->id,
                    'expense_id' => $expense->id,
                    'month_number' => 1,
                    'description' => $descBase,
                    'amount' => $balance,
                    'formatted_amount' => CurrencyHelper::formatCurrency($balance),
                    'due_amount' => $dueAmount,
                    'formatted_due_amount' => CurrencyHelper::formatCurrency($dueAmount),
                    'paid_amount' => $paidAmount,
                    'formatted_paid_amount' => CurrencyHelper::formatCurrency($paidAmount),
                    'status' => $status,
                    'type' => 'full',
                    'transaction_date' => $requestedStart->toDateString(),
                    'expense_type_name' => $expense->expenseType?->name,
                    'user_name' => null,
                ]);
            }

            return $rows->sortByDesc(fn ($r) => $r['transaction_date'])->values();
        }

        // Default: return actual transactions (non-month scoped behavior)
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
        /** @var MonthlyPaymentCalculator $calculator */
        $calculator = app(MonthlyPaymentCalculator::class);

        $expenses = Expense::query()
            ->where('card_id', $card->id)
            ->whereNotNull('transaction_date')
            ->with('paymentTerm:id,months')
            ->get([
                'transaction_date',
                'amount',
                'type',
                'payment_type',
                'monthly_amortization',
                'payment_term_id',
                'paid_months',
                'paid_month_amounts',
            ]);

        if ($expenses->isEmpty()) {
            return [];
        }

        $monthlyTotals = [];

        foreach ($expenses as $expense) {
            $start = Carbon::parse($expense->transaction_date)->startOfMonth();
            $isInstallment = ($expense->payment_type ?? 'full') === 'installment';
            $months = $isInstallment ? InstallmentTermHelper::resolveInstallmentTermMonths($expense) : 1;
            $months = max(1, $months);
            $monthlyAmount = $isInstallment
                ? (float) ($expense->monthly_amortization ?? 0)
                : (float) ($expense->amount ?? 0);

            for ($i = 0; $i < $months; $i++) {
                $ym = $start->copy()->addMonths($i)->format('Y-m');
                if (! isset($monthlyTotals[$ym])) {
                    $monthlyTotals[$ym] = 0.0;
                }

                // Compute remaining due for the installment month using the same waterfall logic.
                // For full payments, we treat them as "month 1 only".
                if ($isInstallment) {
                    $monthNo = $i + 1;
                    $req = $calculator->installmentRequirementForMonthNumber($expense, $monthNo);
                    $monthlyTotals[$ym] += (float) ($req['balance'] ?? 0.0);
                } else {
                    // Full payment belongs to only its transaction month ("month 1").
                    $isPaid = in_array(1, $expense->paid_months ?? [], true);
                    $monthlyTotals[$ym] += $isPaid ? 0.0 : round($monthlyAmount, 2);
                    break; // prevent adding same full amount to future months
                }
            }
        }

        return collect($monthlyTotals)
            ->sortKeys()
            ->map(function ($total, $yyyyMm) {
                $date = Carbon::createFromFormat('Y-m', $yyyyMm)->startOfMonth();
                return [
                    'value' => $yyyyMm,
                    'label' => $date->format('F Y'),
                    'total_due' => round((float) $total, 2),
                ];
            })
            ->values()
            ->all();
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

