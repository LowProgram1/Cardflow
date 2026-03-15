<?php

namespace App\Services;

use App\Helpers\CurrencyHelper;
use App\Helpers\StatementPeriodHelper;
use App\Models\User;
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
        $adminIds = User::query()->where('role', 'admin')->pluck('id')->all();
        $totalExpenses = $this->expenses->totalByType($userId, null, 'expense', true, $adminIds);
        $totalPayments = $this->expenses->totalByType($userId, null, 'payment', true, $adminIds);
        $paidPortion = $this->expenses->getTotalPaidPortion($userId, true, $adminIds);
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

    public function dashboardData(?int $userId = null, ?int $cardsUserId = null): array
    {
        $adminIds = User::query()->where('role', 'admin')->pluck('id')->all();
        $metrics = $this->metrics($userId);

        $cardsScopeUserId = $cardsUserId ?? $userId;
        $cards = $this->cards->allActive($cardsScopeUserId)->map(function ($card) {
            return [
                'id' => $card->id,
                'name' => $card->name,
                'last_four' => $card->last_four,
                'statement_day' => $card->statement_day,
                'due_day' => $card->due_day,
                'formatted_limit' => CurrencyHelper::formatCurrency((float) $card->limit),
            ];
        });

        $isAdminView = $userId === null;
        $recentExpenses = $this->expenses->recentWithRelations(50, $userId, true, $adminIds)->map(function ($expense) use ($isAdminView) {
            $card = $expense->card;
            $cardLabel = $isAdminView
                ? ($card && $card->last_four ? '****' . $card->last_four : '—')
                : ($card?->name ?? 'Unknown card');
            return [
                'id' => $expense->id,
                'description' => $expense->description,
                'expense_type_name' => $expense->expenseType?->name,
                'amount' => (float) $expense->amount,
                'formatted_amount' => CurrencyHelper::formatCurrency((float) $expense->amount),
                'type' => $expense->type,
                'type_label' => $expense->type === 'payment' ? 'Payment' : 'Expense',
                'transaction_date' => optional($expense->transaction_date)->format('Y-m-d'),
                'card_name' => $cardLabel,
                'user_name' => $expense->user?->name ?? '—',
                'card_id' => $expense->card_id,
                'statement_day' => $expense->card?->statement_day ?? 1,
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
                'card_id' => $p['card_id'] ?? null,
                'statement_day' => (int) ($p['statement_day'] ?? 1),
            ]);
        }

        $installmentExpenses = $this->expenses->getInstallmentExpenses($userId, true, $adminIds)->filter(function ($expense) {
            $months = $expense->paymentTerm?->months ?? 0;
            $paidCount = count($expense->paid_months ?? []);
            $amounts = $expense->paid_month_amounts ?? [];
            $totalPaid = is_array($amounts) && $amounts !== []
                ? (float) array_sum(array_map('floatval', $amounts))
                : $paidCount * (float) ($expense->monthly_amortization ?? 0);
            $totalAmount = (float) $expense->amount;
            $remaining = $totalAmount - $totalPaid;
            $remainingMonths = max(0, $months - $paidCount);
            if ($remainingMonths > 0) {
                return true;
            }
            if ($remaining < 0) {
                return true;
            }
            if (! $expense->last_paid_at) {
                return true;
            }

            return $expense->last_paid_at->gte(now()->subHours(24));
        })->map(function ($expense) use ($isAdminView) {
            $months = $expense->paymentTerm?->months ?? 0;
            $monthly = (float) ($expense->monthly_amortization ?? 0);
            $paidCount = count($expense->paid_months ?? []);
            $amounts = $expense->paid_month_amounts ?? [];
            $totalPaid = is_array($amounts) && $amounts !== []
                ? (float) array_sum(array_map('floatval', $amounts))
                : $paidCount * $monthly;
            $totalAmount = (float) $expense->amount;
            $remaining = round($totalAmount - $totalPaid, 2);
            $remainingMonths = max(0, $months - $paidCount);
            $card = $expense->card;
            $cardLabel = $isAdminView
                ? ($card && $card->last_four ? '****' . $card->last_four : '—')
                : ($card?->name ?? 'Unknown');

            $paidMonthsArray = $expense->paid_months ?? [];
            $paidAmountsArray = is_array($amounts) && $amounts !== []
                ? array_map('floatval', $amounts)
                : array_fill(0, $paidCount, $monthly);

            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'user_name' => $expense->user?->name ?? '—',
                'payment_type' => 'installment',
                'card_name' => $cardLabel,
                'card_id' => $expense->card_id,
                'statement_day' => (int) ($card?->statement_day ?? 1),
                'expense_type_name' => $expense->expenseType?->name,
                'transaction_date' => optional($expense->transaction_date)->format('Y-m-d'),
                'last_paid_at' => optional($expense->last_paid_at)->format('Y-m-d'),
                'months' => $months,
                'monthly_amortization' => $monthly,
                'formatted_monthly' => CurrencyHelper::formatCurrency($monthly),
                'paid_months_count' => $paidCount,
                'paid_months' => $paidMonthsArray,
                'paid_month_amounts' => $paidAmountsArray,
                'total_paid' => $totalPaid,
                'formatted_total_paid' => CurrencyHelper::formatCurrency($totalPaid),
                'remaining_months' => $remainingMonths,
                'remaining' => $remaining,
                'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
                'total_amount' => $totalAmount,
                'formatted_total_amount' => CurrencyHelper::formatCurrency($totalAmount),
            ];
        });

        $fullPaymentExpenses = $this->expenses->getFullPaymentExpenses($userId, true, $adminIds)->filter(function ($expense) {
            $isPaid = in_array(1, $expense->paid_months ?? [], true);
            if (! $isPaid) {
                return true;
            }
            if (! $expense->last_paid_at) {
                return true;
            }

            return $expense->last_paid_at->gte(now()->subHours(24));
        })->map(function ($expense) use ($isAdminView) {
            $amount = (float) $expense->amount;
            $isPaid = in_array(1, $expense->paid_months ?? [], true);
            $totalPaid = $isPaid ? $amount : 0;
            $remaining = $isPaid ? 0 : $amount;
            $card = $expense->card;
            $fullCardLabel = $isAdminView
                ? ($card && $card->last_four ? '****' . $card->last_four : '—')
                : ($card?->name ?? 'Unknown');

            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'user_name' => $expense->user?->name ?? '—',
                'payment_type' => 'full',
                'card_name' => $fullCardLabel,
                'card_id' => $expense->card_id,
                'statement_day' => (int) ($card?->statement_day ?? 1),
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
            $paymentType = $item['payment_type'] ?? 'installment';
            $baseDescription = $item['expense_type_name'] ?? ($paymentType === 'full' ? 'Full payment' : 'Installment') . ' · ' . ($item['card_name'] ?? '');
            $datePaid = $item['last_paid_at'] ?? $item['transaction_date'];

            if ($paymentType === 'installment') {
                $paidAmounts = $item['paid_month_amounts'] ?? [];
                $paidMonths = $item['paid_months'] ?? [];
                $monthly = (float) ($item['monthly_amortization'] ?? 0);
                $count = count($paidAmounts) ?: count($paidMonths) ?: (int) ($item['paid_months_count'] ?? 0);
                if ($count <= 0) {
                    continue;
                }
                for ($i = 0; $i < $count; $i++) {
                    $amount = isset($paidAmounts[$i]) ? (float) $paidAmounts[$i] : $monthly;
                    $monthNum = $paidMonths[$i] ?? ($i + 1);
                    $transactionHistory->push([
                        'id' => 'installment-' . $item['id'] . '-month-' . $monthNum,
                        'user_name' => $item['user_name'] ?? '—',
                        'amount_paid' => $amount,
                        'formatted_amount_paid' => CurrencyHelper::formatCurrency($amount),
                        'transaction_date' => $item['transaction_date'],
                        'date_paid' => $datePaid,
                        'description' => $baseDescription . ' (month ' . $monthNum . ')',
                        'card_id' => $item['card_id'] ?? null,
                        'statement_day' => (int) ($item['statement_day'] ?? 1),
                    ]);
                }
            } else {
                $totalPaid = $item['total_paid'] ?? 0;
                if ($totalPaid <= 0) {
                    continue;
                }
                $transactionHistory->push([
                    'id' => 'full-' . $item['id'],
                    'user_name' => $item['user_name'] ?? '—',
                    'amount_paid' => $totalPaid,
                    'formatted_amount_paid' => $item['formatted_total_paid'] ?? CurrencyHelper::formatCurrency($totalPaid),
                    'transaction_date' => $item['transaction_date'],
                    'date_paid' => $datePaid,
                    'description' => $baseDescription,
                    'card_id' => $item['card_id'] ?? null,
                    'statement_day' => (int) ($item['statement_day'] ?? 1),
                ]);
            }
        }
        $transactionHistory = $transactionHistory->sortByDesc('date_paid')->values();

        $transactionHistory = $transactionHistory->filter(function ($row) {
            $datePaid = $row['date_paid'] ?? null;
            if (! $datePaid) {
                return true;
            }
            if (! Carbon::parse($datePaid)->startOfDay()->gte(now()->subDays(5)->startOfDay())) {
                return false;
            }
            $cardId = $row['card_id'] ?? null;
            $statementDay = (int) ($row['statement_day'] ?? 1);
            if ($cardId === null) {
                return true;
            }
            [$from, $to] = StatementPeriodHelper::periodContainingDate(Carbon::parse($datePaid), $statementDay);
            if ($to->lt(now()->startOfDay())) {
                return false;
            }

            return true;
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

