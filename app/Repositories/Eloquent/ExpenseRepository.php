<?php

namespace App\Repositories\Eloquent;

use App\Models\Expense;
use App\Repositories\Contracts\ExpenseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ExpenseRepository implements ExpenseRepositoryInterface
{
    public function paginateWithRelations(int $perPage = 15): LengthAwarePaginator
    {
        return Expense::query()
            ->with(['card', 'user', 'expenseType', 'paymentTerm'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $attributes): Expense
    {
        return Expense::query()->create($attributes);
    }

    public function update(Expense $expense, array $attributes): Expense
    {
        $expense->fill($attributes);
        $expense->save();

        return $expense;
    }

    public function delete(Expense $expense): void
    {
        $expense->delete();
    }

    public function recentWithRelations(int $limit = 10): Collection
    {
        return Expense::query()
            ->with(['card', 'user', 'expenseType', 'paymentTerm'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    public function totalByType(?int $userId = null, ?int $cardId = null, ?string $type = null): float
    {
        $query = Expense::query();

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        if ($cardId !== null) {
            $query->where('card_id', $cardId);
        }

        if ($type !== null) {
            $query->where('type', $type);
        }

        return (float) $query->sum('amount');
    }

    public function getInstallmentExpenses(): Collection
    {
        return Expense::query()
            ->with(['card', 'user', 'expenseType', 'paymentTerm'])
            ->where('payment_type', 'installment')
            ->whereNotNull('payment_term_id')
            ->orderByDesc('transaction_date')
            ->get();
    }

    public function getFullPaymentExpenses(): Collection
    {
        return Expense::query()
            ->with(['card', 'user', 'expenseType'])
            ->where('payment_type', 'full')
            ->where('type', 'expense')
            ->orderByDesc('transaction_date')
            ->get();
    }

    public function getTotalPaidPortion(): float
    {
        $installments = Expense::query()
            ->where('payment_type', 'installment')
            ->where('type', 'expense')
            ->whereNotNull('monthly_amortization')
            ->get();

        $full = Expense::query()
            ->where('payment_type', 'full')
            ->where('type', 'expense')
            ->get();

        $sum = 0.0;
        foreach ($installments as $e) {
            $amounts = $e->paid_month_amounts;
            if (is_array($amounts) && $amounts !== []) {
                $sum += array_sum(array_map('floatval', $amounts));
            } else {
                $paidCount = count($e->paid_months ?? []);
                $sum += $paidCount * (float) $e->monthly_amortization;
            }
        }
        foreach ($full as $e) {
            $paid = in_array(1, $e->paid_months ?? [], true);
            if ($paid) {
                $sum += (float) $e->amount;
            }
        }

        return $sum;
    }
}

