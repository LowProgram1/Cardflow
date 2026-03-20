<?php

namespace App\Services;

use App\Helpers\CurrencyHelper;
use App\Helpers\InstallmentTermHelper;
use App\Helpers\StatementPeriodHelper;
use App\Models\Expense;
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
        private readonly MonthlyPaymentCalculator $monthlyCalculator,
    ) {
    }

    public function metrics(?int $userId = null): array
    {
        $adminIds = User::query()->where('role', 'admin')->pluck('id')->all();
        $outstanding = 0.0;
        $query = Expense::query()
            ->with(['card'])
            ->where('type', 'expense')
            ->orderByDesc('transaction_date');
        if ($userId !== null) {
            $query->where('user_id', $userId);
        } else {
            $query->adminCreated($adminIds);
        }
        $expenses = $query->get();

        foreach ($expenses as $expense) {
            if (! $this->isInCurrentCardStatementCycle($expense)) {
                continue;
            }
            $outstanding += $this->dueForCurrentCycle($expense);
        }

        $result = [
            'total_outstanding' => round($outstanding, 2),
            'formatted_total_outstanding' => CurrencyHelper::formatCurrency($outstanding),
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
        $adminCreatedOnly = $userId === null;

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
        $recentExpenses = $this->expenses->recentWithRelations(50, $userId, $adminCreatedOnly, $adminIds)->map(function ($expense) use ($isAdminView) {
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
                'card_last_four' => $p['card_last_four'] ?? null,
                'amount_paid' => $p['amount'],
                'formatted_amount_paid' => $p['formatted_amount'],
                'transaction_date' => $p['transaction_date'],
                'date_paid' => $p['transaction_date'],
                'description' => $p['description'] ?? $p['expense_type_name'] ?? $p['type_label'],
                'card_id' => $p['card_id'] ?? null,
                'statement_day' => (int) ($p['statement_day'] ?? 1),
                'status' => 'paid',
            ]);
        }

        $installmentExpenses = $this->expenses->getInstallmentExpenses($userId, $adminCreatedOnly, $adminIds)->filter(function ($expense) {
            $months = InstallmentTermHelper::resolveInstallmentTermMonths($expense);
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
            $months = InstallmentTermHelper::resolveInstallmentTermMonths($expense);
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
            $cardLabel = $card?->name ?? ($card && $card->last_four ? '****' . $card->last_four : '—');

            $paidMonthsArray = $expense->paid_months ?? [];
            $paidAmountsArray = is_array($amounts) && $amounts !== []
                ? array_map('floatval', $amounts)
                : array_fill(0, $paidCount, $monthly);
            $currentCycleDue = $this->dueForCurrentCycle($expense);
            $coverageMonths = $this->coverageMonthsForExpense($expense);

            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'user_name' => $expense->user?->name ?? '—',
                'payment_type' => 'installment',
                'card_name' => $cardLabel,
                'card_last_four' => $card?->last_four,
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
                'current_cycle_due' => $currentCycleDue,
                'formatted_current_cycle_due' => CurrencyHelper::formatCurrency($currentCycleDue),
                'coverage_months' => $coverageMonths,
            ];
        });

        $fullPaymentExpenses = $this->expenses->getFullPaymentExpenses($userId, $adminCreatedOnly, $adminIds)->filter(function ($expense) {
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
            $fullCardLabel = $card?->name ?? ($card && $card->last_four ? '****' . $card->last_four : '—');

            $currentCycleDue = $this->dueForCurrentCycle($expense);
            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'user_name' => $expense->user?->name ?? '—',
                'payment_type' => 'full',
                'card_name' => $fullCardLabel,
                'card_last_four' => $card?->last_four,
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
                'current_cycle_due' => $currentCycleDue,
                'formatted_current_cycle_due' => CurrencyHelper::formatCurrency($currentCycleDue),
                'coverage_months' => [$expense->transaction_date ? Carbon::parse($expense->transaction_date)->format('F Y') : null],
            ];
        });

        $allExpenseItems = $installmentExpenses->concat($fullPaymentExpenses)->sortByDesc('transaction_date')->values();

        // Client expenses can be posted on admin-owned/shared cards.
        // Ensure dashboard outstanding includes any card referenced by the user's expenses,
        // not only cards directly owned by the logged-in user.
        $cardsById = collect($cards)->keyBy(fn ($card) => (int) ($card['id'] ?? 0));
        foreach ($allExpenseItems as $item) {
            $cardId = (int) ($item['card_id'] ?? 0);
            if ($cardId <= 0 || $cardsById->has($cardId)) {
                continue;
            }
            $cardsById->put($cardId, [
                'id' => $cardId,
                'name' => $item['card_name'] ?? '—',
                'last_four' => $item['card_last_four'] ?? null,
                'statement_day' => (int) ($item['statement_day'] ?? 1),
                'due_day' => null,
                'formatted_limit' => CurrencyHelper::formatCurrency(0),
            ]);
        }
        $cards = $cardsById->values();

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
                        'card_last_four' => $item['card_last_four'] ?? null,
                        'statement_day' => (int) ($item['statement_day'] ?? 1),
                        'status' => 'expense',
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
                    'card_last_four' => $item['card_last_four'] ?? null,
                    'statement_day' => (int) ($item['statement_day'] ?? 1),
                    'status' => 'expense',
                ]);
            }
        }
        $transactionHistory = $transactionHistory->sortByDesc('date_paid')->values();

        $transactionHistory = $transactionHistory->filter(function ($row) {
            $txDate = $row['date_paid'] ?? $row['transaction_date'] ?? null;
            if (! $txDate) {
                return true;
            }
            $cardId = $row['card_id'] ?? null;
            if ($cardId === null) {
                return false;
            }
            $statementDay = (int) ($row['statement_day'] ?? 1);
            [$fromNow, $toNow] = StatementPeriodHelper::periodContainingDate(now(), $statementDay);
            $tx = Carbon::parse($txDate)->startOfDay();
            return $tx->gte($fromNow->copy()->startOfDay()) && $tx->lte($toNow->copy()->endOfDay());
        })->values()->all();

        $remainingByCard = [];

        $monthlySummaryRows = $allExpenseItems->map(function ($item) {
            $status = (($item['current_cycle_due'] ?? 0) > 0) ? 'pending' : 'paid';
            return [
                'cardName' => $item['card_name'] ?? 'Unknown',
                'cardLast4' => $item['card_last_four'] ?? null,
                'monthlyAmount' => (float) ($item['current_cycle_due'] ?? 0),
                'formattedMonthlyAmount' => CurrencyHelper::formatCurrency((float) ($item['current_cycle_due'] ?? 0)),
                'paymentStatus' => $status,
            ];
        })->values()->all();

        $monthlyTotals = collect($allExpenseItems)
            ->filter(fn ($item) => ((float) ($item['current_cycle_due'] ?? 0)) > 0)
            ->groupBy(function ($item) {
                $txDate = Carbon::parse($item['transaction_date']);
                $statementDay = (int) ($item['statement_day'] ?? 1);
                [, $periodEnd] = StatementPeriodHelper::periodContainingDate($txDate, max(1, min(31, $statementDay)));

                return $periodEnd->format('Y-m');
            })
            ->map(function ($items, $ym) {
                $total = (float) $items->sum(function ($item) {
                    return (float) ($item['current_cycle_due'] ?? 0);
                });
                $label = Carbon::createFromFormat('Y-m', $ym)->format('F Y');

                return [
                    'statementMonth' => $ym,
                    'label' => $label,
                    'totalToPay' => round($total, 2),
                    'formattedTotalToPay' => CurrencyHelper::formatCurrency($total),
                ];
            })
            ->sortBy('statementMonth')
            ->values()
            ->all();

        // Expand each installment/full expense into a row per covered month,
        // then aggregate duplicates by card + statement month so the table
        // doesn't grow with redundant card repetitions.
        $monthlyPaymentRows = collect($allExpenseItems)->flatMap(function ($item) {
            $paymentType = $item['payment_type'] ?? 'installment';
            $coverageMonths = is_array($item['coverage_months'] ?? null) ? $item['coverage_months'] : [];
            $paidMonths = is_array($item['paid_months'] ?? null) ? $item['paid_months'] : [];
            $monthly = (float) ($item['monthly_amortization'] ?? 0);

            return collect($coverageMonths)
                ->map(function ($label, $idx) use ($item, $paidMonths, $monthly) {
                    $monthNo = $idx + 1;
                    $due = in_array($monthNo, $paidMonths, true) ? 0.0 : round($monthly, 2);

                    $monthKey = null;
                    try {
                        $monthKey = Carbon::createFromFormat('F Y', $label)->format('Y-m');
                    } catch (\Throwable $e) {
                        $monthKey = null;
                    }

                    return [
                        'card_id' => $item['card_id'] ?? null,
                        'card_name' => $item['card_name'] ?? '—',
                        'card_last_four' => $item['card_last_four'] ?? null,
                        'month_label' => $label,
                        'month_key' => $monthKey,
                        'to_pay' => $due,
                    ];
                })
                ->values()
                ->all();
        })->groupBy(function ($row) {
            return ($row['card_id'] ?? 'x') . '|' . ($row['month_key'] ?? 'unknown');
        })->map(function ($rows, $key) {
            $first = $rows->first();
            $toPay = (float) $rows->sum(fn ($r) => (float) ($r['to_pay'] ?? 0));

            return [
                'id' => $key,
                'card_id' => $first['card_id'] ?? null,
                'month_label' => $first['month_label'] ?? '—',
                'card_name' => $first['card_name'] ?? '—',
                'card_last_four' => $first['card_last_four'] ?? null,
                'to_pay' => round($toPay, 2),
                'formatted_to_pay' => CurrencyHelper::formatCurrency($toPay),
                'payment_status' => $toPay > 0 ? 'pending' : 'paid',
                'month_key' => $first['month_key'] ?? null,
            ];
        })->sortBy(function ($row) {
            return $row['month_key'] ?? '9999-99';
        })->values()->all();

        // Outstanding by card should follow statement cycle, not calendar month.
        // Use current_cycle_due (already statement-cycle aware) and aggregate per card.
        $statementMonthByCard = collect($cards)->mapWithKeys(function ($card) {
            $statementDay = max(1, min(31, (int) ($card['statement_day'] ?? 1)));
            [, $to] = StatementPeriodHelper::periodContainingDate(now(), $statementDay);
            return [(int) $card['id'] => $to->format('Y-m')];
        });

        $currentDueByCard = collect($allExpenseItems)
            ->groupBy('card_id')
            ->map(fn ($items) => (float) $items->sum(fn ($item) => (float) ($item['current_cycle_due'] ?? 0)));

        $remainingByCard = collect($cards)
            ->map(function ($card) use ($currentDueByCard, $statementMonthByCard) {
                $cardId = (int) ($card['id'] ?? 0);
                $remaining = (float) ($currentDueByCard->get($cardId, 0.0));
                $statementMonth = $statementMonthByCard->get($cardId);

                return [
                    'card_id' => $cardId,
                    'card_name' => $card['name'] ?? '—',
                    'card_last_four' => $card['last_four'] ?? null,
                    'statement_month' => $statementMonth,
                    'statement_month_label' => $statementMonth
                        ? Carbon::createFromFormat('Y-m', $statementMonth)->format('F Y')
                        : '—',
                    'remaining' => round($remaining, 2),
                    'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
                ];
            })
            ->values()
            ->all();

        $metrics['total_outstanding'] = round((float) collect($remainingByCard)->sum('remaining'), 2);
        $metrics['formatted_total_outstanding'] = CurrencyHelper::formatCurrency((float) $metrics['total_outstanding']);

        // Transaction History logs for the active month:
        // include both expense/installment monthly entries and paid/payment entries.
        $currentMonthKey = now()->format('Y-m');
        $expenseMonthLogs = collect($monthlyPaymentRows)
            ->filter(function ($row) use ($currentMonthKey) {
                return ($row['month_key'] ?? null) === $currentMonthKey;
            })
            ->map(function ($row, $idx) {
                $monthKey = $row['month_key'] ?? now()->format('Y-m');
                $date = $monthKey . '-01';
                return [
                    'id' => 'expense-log-' . ($row['id'] ?? $idx),
                    'user_name' => '—',
                    'card_last_four' => $row['card_last_four'] ?? null,
                    'amount_paid' => (float) ($row['to_pay'] ?? 0),
                    'formatted_amount_paid' => $row['formatted_to_pay'] ?? CurrencyHelper::formatCurrency((float) ($row['to_pay'] ?? 0)),
                    'transaction_date' => $date,
                    'date_paid' => $date,
                    'description' => ($row['card_name'] ?? 'Card') . ' · ' . ($row['month_label'] ?? 'Month'),
                    'card_id' => $row['card_id'] ?? null,
                    'statement_day' => 1,
                    'status' => 'expense',
                ];
            });

        $paidMonthLogs = collect($transactionHistory)
            ->map(function ($row) {
                $date = $row['date_paid'] ?? $row['transaction_date'] ?? null;
                return [
                    'id' => $row['id'] ?? uniqid('tx-', true),
                    'user_name' => $row['user_name'] ?? '—',
                    'card_last_four' => $row['card_last_four'] ?? null,
                    'amount_paid' => (float) ($row['amount_paid'] ?? 0),
                    'formatted_amount_paid' => $row['formatted_amount_paid'] ?? CurrencyHelper::formatCurrency((float) ($row['amount_paid'] ?? 0)),
                    'transaction_date' => $date,
                    'date_paid' => $date,
                    'description' => 'Payment · ' . ($row['description'] ?? 'Transaction'),
                    'card_id' => $row['card_id'] ?? null,
                    'statement_day' => (int) ($row['statement_day'] ?? 1),
                    'status' => 'paid',
                ];
            })
            ->filter(function ($row) {
                $date = $row['date_paid'] ?? $row['transaction_date'] ?? null;
                if (! $date) {
                    return false;
                }
                $statementDay = (int) ($row['statement_day'] ?? 1);
                try {
                    [$fromNow, $toNow] = StatementPeriodHelper::periodContainingDate(now(), $statementDay);
                    $tx = Carbon::parse($date)->startOfDay();
                    return $tx->gte($fromNow->copy()->startOfDay()) && $tx->lte($toNow->copy()->endOfDay());
                } catch (\Throwable $e) {
                    return false;
                }
            });

        $transactionHistory = $expenseMonthLogs
            ->concat($paidMonthLogs)
            ->sortBy(function ($row) {
                try {
                    return Carbon::parse($row['date_paid'] ?? $row['transaction_date'])->format('Y-m-d');
                } catch (\Throwable $e) {
                    return '9999-12-31';
                }
            })
            ->values()
            ->all();

        $installmentSummary = [
            'total_paid' => $allExpenseItems->sum('total_paid'),
            'total_remaining' => $allExpenseItems->sum('remaining'),
            'formatted_total_paid' => CurrencyHelper::formatCurrency($allExpenseItems->sum('total_paid')),
            'formatted_total_remaining' => CurrencyHelper::formatCurrency($allExpenseItems->sum('remaining')),
            'monthlyRows' => $monthlySummaryRows,
            'monthlyTotals' => $monthlyTotals,
        ];

        return [
            'metrics' => $metrics,
            'cards' => $cards,
            'recentExpenses' => $recentExpenses,
            'paymentLogs' => $paymentLogs,
            'transactionHistory' => $transactionHistory,
            'installmentExpenses' => $monthlyPaymentRows,
            'installmentSummary' => $installmentSummary,
            'remainingByCard' => $remainingByCard,
        ];
    }

    private function isInCurrentCardStatementCycle(Expense $expense): bool
    {
        if (! $expense->transaction_date) {
            return false;
        }
        $statementDay = (int) ($expense->card?->statement_day ?? 1);
        $statementDay = max(1, min(31, $statementDay));
        [$from, $to] = StatementPeriodHelper::periodContainingDate(now(), $statementDay);
        $tx = Carbon::parse($expense->transaction_date)->startOfDay();

        return $tx->gte($from->copy()->startOfDay()) && $tx->lte($to->copy()->endOfDay());
    }

    private function dueForCurrentCycle(Expense $expense): float
    {
        if (($expense->payment_type ?? 'full') === 'installment') {
            $monthNumber = $this->installmentMonthNumberForCurrentCycle($expense);
            if ($monthNumber === null) {
                return 0.0;
            }
            $req = $this->monthlyCalculator->installmentRequirementForMonthNumber($expense, $monthNumber);
            $currentBalance = (float) ($req['balance'] ?? 0.0);
            $currentRequired = (float) ($req['amount_required'] ?? 0.0);
            $currentPaid = (float) (($req['amount_paid'] ?? 0.0) ?: 0.0);

            $amounts = $expense->paid_month_amounts ?? [];
            $amounts = array_map(
                fn ($v) => round((float) $v, 2),
                array_combine(array_map('intval', array_keys($amounts)), array_values($amounts))
            );
            $amounts = array_filter($amounts, fn ($v) => $v !== null && $v !== '');

            if (empty($amounts) && ! empty($expense->paid_months)) {
                $monthly = round((float) ($expense->monthly_amortization ?? 0), 2);
                foreach ($expense->paid_months as $m) {
                    $amounts[(int) $m] = $monthly;
                }
            }

            // Credit from explicit future-month/extra payments appears as negative outstanding
            // until the corresponding statement month arrives and consumes that credit.
            $advanceCredit = 0.0;
            foreach ($amounts as $m => $amt) {
                if ((int) $m > $monthNumber) {
                    $advanceCredit += (float) $amt;
                }
            }

            // Overpayment in the current month also creates immediate advance credit.
            $currentOverpay = max(0.0, $currentPaid - $currentRequired);

            return round($currentBalance - $advanceCredit - $currentOverpay, 2);
        }
        $isPaid = in_array(1, $expense->paid_months ?? [], true);

        // Full-payment expense is due only in the statement cycle containing its posting date.
        if (! $this->isInCurrentCardStatementCycle($expense)) {
            return 0.0;
        }

        return $isPaid ? 0.0 : round((float) $expense->amount, 2);
    }

    private function installmentMonthNumberForCurrentCycle(Expense $expense): ?int
    {
        if (! $expense->transaction_date) {
            return null;
        }
        $statementDay = max(1, min(31, (int) ($expense->card?->statement_day ?? 1)));
        $startDate = Carbon::parse($expense->transaction_date);
        [, $startPeriodEnd] = StatementPeriodHelper::periodContainingDate($startDate, $statementDay);
        [, $currentPeriodEnd] = StatementPeriodHelper::periodContainingDate(now(), $statementDay);

        $monthDiff = $startPeriodEnd->copy()->startOfMonth()->diffInMonths($currentPeriodEnd->copy()->startOfMonth(), false);
        $monthNumber = (int) $monthDiff + 1;

        return $monthNumber < 1 ? null : $monthNumber;
    }

    private function coverageMonthsForExpense(Expense $expense): array
    {
        if (! $expense->transaction_date) {
            return [];
        }
        $start = Carbon::parse($expense->transaction_date)->startOfMonth();
        $months = (int) ($expense->payment_type === 'installment'
            ? InstallmentTermHelper::resolveInstallmentTermMonths($expense)
            : 1);

        $labels = [];
        for ($i = 0; $i < max(1, $months); $i++) {
            $labels[] = $start->copy()->addMonths($i)->format('F Y');
        }

        return $labels;
    }
}

