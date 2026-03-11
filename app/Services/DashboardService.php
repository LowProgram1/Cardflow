<?php

namespace App\Services;

use App\Helpers\CurrencyHelper;
use App\Repositories\Contracts\CardRepositoryInterface;
use App\Repositories\Contracts\ExpenseRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Contracts\DashboardServiceInterface;
use Carbon\Carbon;

class DashboardService implements DashboardServiceInterface
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly CardRepositoryInterface $cards,
        private readonly ExpenseRepositoryInterface $expenses,
    ) {
    }

    public function metrics(?int $userId = null): array
    {
        $totalExpenses = $this->expenses->totalByType($userId, null, 'expense');
        $totalPayments = $this->expenses->totalByType($userId, null, 'payment');
        $paidPortion = $this->expenses->getTotalPaidPortion($userId);
        $outstanding = $totalExpenses - $totalPayments - $paidPortion;

        $result = [
            'total_outstanding' => max(0, $outstanding),
            'formatted_total_outstanding' => CurrencyHelper::formatCurrency(max(0, $outstanding)),
        ];

        if ($userId === null) {
            $result['total_users'] = $this->users->count();
            $result['active_cards'] = $this->cards->countActive();
        } else {
            $result['total_users'] = null;
            $result['active_cards'] = $this->cards->countActiveForUser($userId);
        }

        return $result;
    }

    public function dashboardData(?int $userId = null): array
    {
        $metrics = $this->metrics($userId);

        $cards = $this->cards->allActive($userId)->map(function ($card) {
            return [
                'id' => $card->id,
                'name' => $card->name,
                'last_four' => $card->last_four,
                'statement_day' => $card->statement_day,
                'due_day' => $card->due_day,
                'formatted_limit' => CurrencyHelper::formatCurrency((float) $card->limit),
            ];
        });

        $recentExpenses = $this->expenses->recentWithRelations(50, $userId)->map(function ($expense) {
            return [
                'id' => $expense->id,
                'description' => $expense->description,
                'expense_type_name' => $expense->expenseType?->name,
                'amount' => (float) $expense->amount,
                'formatted_amount' => CurrencyHelper::formatCurrency((float) $expense->amount),
                'type' => $expense->type,
                'type_label' => $expense->type === 'payment' ? 'Payment' : 'Expense',
                'transaction_date' => optional($expense->transaction_date)->format('Y-m-d'),
                'card_name' => $expense->card?->name ?? 'Unknown card',
                'user_name' => $expense->user?->name ?? '—',
            ];
        });

        $paymentLogs = $recentExpenses->where('type', 'payment')->values()->all();

        // Transaction history: paid expenses (type=payment + installments/full with paid portions)
        $transactionHistory = collect();

        foreach ($recentExpenses->where('type', 'payment') as $p) {
            $transactionHistory->push([
                'id' => 'payment-' . $p['id'],
                'user_name' => $p['user_name'] ?? '—',
                'amount_paid' => $p['amount'],
                'formatted_amount_paid' => $p['formatted_amount'],
                'transaction_date' => $p['transaction_date'],
                'date_paid' => $p['transaction_date'],
                'description' => $p['description'] ?? $p['expense_type_name'] ?? $p['type_label'],
            ]);
        }

        $installmentExpenses = $this->expenses->getInstallmentExpenses($userId)->filter(function ($expense) {
            $months = $expense->paymentTerm?->months ?? 0;
            $paidCount = count($expense->paid_months ?? []);
            $remainingMonths = max(0, $months - $paidCount);
            if ($remainingMonths > 0) {
                return true;
            }
            if (! $expense->last_paid_at) {
                return true;
            }

            return $expense->last_paid_at->gte(now()->subHours(24));
        })->map(function ($expense) {
            $months = $expense->paymentTerm?->months ?? 0;
            $monthly = (float) ($expense->monthly_amortization ?? 0);
            $paidCount = count($expense->paid_months ?? []);
            $totalPaid = $paidCount * $monthly;
            $remainingMonths = max(0, $months - $paidCount);
            $remaining = $remainingMonths * $monthly;

            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'user_name' => $expense->user?->name ?? '—',
                'payment_type' => 'installment',
                'card_name' => $expense->card?->name ?? 'Unknown',
                'expense_type_name' => $expense->expenseType?->name,
                'transaction_date' => optional($expense->transaction_date)->format('Y-m-d'),
                'last_paid_at' => optional($expense->last_paid_at)->format('Y-m-d'),
                'months' => $months,
                'monthly_amortization' => $monthly,
                'formatted_monthly' => CurrencyHelper::formatCurrency($monthly),
                'paid_months_count' => $paidCount,
                'total_paid' => $totalPaid,
                'formatted_total_paid' => CurrencyHelper::formatCurrency($totalPaid),
                'remaining_months' => $remainingMonths,
                'remaining' => $remaining,
                'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
                'total_amount' => (float) $expense->amount,
                'formatted_total_amount' => CurrencyHelper::formatCurrency((float) $expense->amount),
            ];
        });

        $fullPaymentExpenses = $this->expenses->getFullPaymentExpenses($userId)->filter(function ($expense) {
            $isPaid = in_array(1, $expense->paid_months ?? [], true);
            if (! $isPaid) {
                return true;
            }
            if (! $expense->last_paid_at) {
                return true;
            }

            return $expense->last_paid_at->gte(now()->subHours(24));
        })->map(function ($expense) {
            $amount = (float) $expense->amount;
            $isPaid = in_array(1, $expense->paid_months ?? [], true);
            $totalPaid = $isPaid ? $amount : 0;
            $remaining = $isPaid ? 0 : $amount;

            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'user_name' => $expense->user?->name ?? '—',
                'payment_type' => 'full',
                'card_name' => $expense->card?->name ?? 'Unknown',
                'expense_type_name' => $expense->expenseType?->name,
                'transaction_date' => optional($expense->transaction_date)->format('Y-m-d'),
                'last_paid_at' => optional($expense->last_paid_at)->format('Y-m-d'),
                'months' => 1,
                'monthly_amortization' => $amount,
                'formatted_monthly' => CurrencyHelper::formatCurrency($amount),
                'paid_months_count' => $isPaid ? 1 : 0,
                'total_paid' => $totalPaid,
                'formatted_total_paid' => CurrencyHelper::formatCurrency($totalPaid),
                'remaining_months' => $isPaid ? 0 : 1,
                'remaining' => $remaining,
                'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
                'total_amount' => $amount,
                'formatted_total_amount' => CurrencyHelper::formatCurrency($amount),
            ];
        });

        $allExpenseItems = $installmentExpenses->concat($fullPaymentExpenses)->sortByDesc('transaction_date')->values();

        foreach ($allExpenseItems as $item) {
            $totalPaid = $item['total_paid'] ?? 0;
            if ($totalPaid <= 0) {
                continue;
            }
            $transactionHistory->push([
                'id' => $item['payment_type'] . '-' . $item['id'],
                'user_name' => $item['user_name'] ?? '—',
                'amount_paid' => $totalPaid,
                'formatted_amount_paid' => $item['formatted_total_paid'] ?? CurrencyHelper::formatCurrency($totalPaid),
                'transaction_date' => $item['transaction_date'],
                'date_paid' => $item['last_paid_at'] ?? $item['transaction_date'],
                'description' => $item['expense_type_name'] ?? ($item['payment_type'] === 'full' ? 'Full payment' : 'Installment') . ' · ' . ($item['card_name'] ?? ''),
            ]);
        }
        $transactionHistory = $transactionHistory->sortByDesc('date_paid')->values();

        $transactionHistory = $transactionHistory->filter(function ($row) {
            $datePaid = $row['date_paid'] ?? null;
            if (! $datePaid) {
                return true;
            }

            return Carbon::parse($datePaid)->startOfDay()->gte(now()->subDays(5)->startOfDay());
        })->values()->all();

        $remainingByUser = $allExpenseItems->groupBy('user_id')->map(function ($items, $uid) {
            $remaining = $items->sum('remaining');
            $userName = $items->first()['user_name'] ?? '—';
            return [
                'user_id' => $uid === 'null' || $uid === '' ? null : (int) $uid,
                'user_name' => $userName,
                'remaining' => $remaining,
                'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
            ];
        })->values()->filter(fn ($u) => $u['remaining'] > 0)->values()->all();

        if ($userId !== null) {
            $remainingByUser = []; // Single-user view: don't show "by user" breakdown on dashboard
        }

        $installmentSummary = [
            'total_paid' => $allExpenseItems->sum('total_paid'),
            'total_remaining' => $allExpenseItems->sum('remaining'),
            'formatted_total_paid' => CurrencyHelper::formatCurrency($allExpenseItems->sum('total_paid')),
            'formatted_total_remaining' => CurrencyHelper::formatCurrency($allExpenseItems->sum('remaining')),
        ];

        return [
            'metrics' => $metrics,
            'cards' => $cards,
            'recentExpenses' => $recentExpenses,
            'paymentLogs' => $paymentLogs,
            'transactionHistory' => $transactionHistory,
            'installmentExpenses' => $allExpenseItems,
            'installmentSummary' => $installmentSummary,
            'remainingByUser' => $remainingByUser,
        ];
    }
}

