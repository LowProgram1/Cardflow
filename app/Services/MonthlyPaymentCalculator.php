<?php

namespace App\Services;

use App\Models\Expense;
use App\Helpers\InstallmentTermHelper;

class MonthlyPaymentCalculator
{
    /**
     * Calculate due amount for an expense for a given month/year.
     * This keeps salary logic separate; only card expense obligations are included.
     */
    public function dueForMonth(Expense $expense, int $year, int $month): float
    {
        if (! $expense->transaction_date) {
            return 0.0;
        }

        if ((int) $expense->transaction_date->year !== $year || (int) $expense->transaction_date->month !== $month) {
            return 0.0;
        }

        if (($expense->type ?? 'expense') !== 'expense') {
            return 0.0;
        }

        if (($expense->payment_type ?? 'full') === 'installment') {
            return round((float) ($expense->monthly_amortization ?? 0), 2);
        }

        $isPaid = in_array(1, $expense->paid_months ?? [], true);

        return $isPaid ? 0.0 : round((float) $expense->amount, 2);
    }

    /**
     * Installment waterfall: compute the required amount / balance for a specific month number (1..term).
     *
     * The month number is relative to the installment start month (Expense.transaction_date month = month 1).
     *
     * @return array{month:int, amount_required:float, amount_paid:float|null, is_covered_by_credit:bool, balance:float}
     */
    public function installmentRequirementForMonthNumber(Expense $expense, int $monthNumber): array
    {
        if (($expense->payment_type ?? 'full') !== 'installment' || ! $expense->paymentTerm) {
            return [
                'month' => $monthNumber,
                'amount_required' => 0.0,
                'amount_paid' => null,
                'is_covered_by_credit' => false,
                'balance' => 0.0,
            ];
        }

        $term = InstallmentTermHelper::resolveInstallmentTermMonths($expense);
        $monthly = round((float) ($expense->monthly_amortization ?? 0), 2);

        if ($monthNumber < 1 || $monthNumber > $term || $monthly <= 0) {
            return [
                'month' => $monthNumber,
                'amount_required' => 0.0,
                'amount_paid' => null,
                'is_covered_by_credit' => false,
                'balance' => 0.0,
            ];
        }

        $amounts = $expense->paid_month_amounts ?? [];
        $amounts = array_map(
            fn ($v) => round((float) $v, 2),
            array_combine(array_map('intval', array_keys($amounts)), array_values($amounts))
        );
        $amounts = array_filter($amounts, fn ($v) => $v !== null && $v !== '');

        if (empty($amounts) && ! empty($expense->paid_months)) {
            foreach ($expense->paid_months as $m) {
                $amounts[(int) $m] = $monthly;
            }
        }

        $carriedCredit = 0.0;
        for ($m = 1; $m <= $term; $m++) {
            $dueThisMonth = round(max(0.0, $monthly - $carriedCredit), 2);
            $userPaid = isset($amounts[$m]) ? $amounts[$m] : null;
            $isCoveredByCredit = false;
            $amountPaid = null;
            $balance = $dueThisMonth;

            if ($userPaid !== null) {
                $amountPaid = $userPaid;
                $balance = round(max(0.0, $dueThisMonth - $userPaid), 2);
                $carriedCredit = round(max(0.0, $userPaid - $monthly), 2);
            } else {
                if ($dueThisMonth <= 0) {
                    $isCoveredByCredit = true;
                    $amountPaid = 0.0;
                    $balance = 0.0;
                    $consumed = min($carriedCredit, $monthly);
                    $carriedCredit = round($carriedCredit - $consumed, 2);
                } else {
                    $carriedCredit = 0.0;
                }
            }

            if ($m === $monthNumber) {
                return [
                    'month' => $m,
                    'amount_required' => $dueThisMonth,
                    'amount_paid' => $amountPaid,
                    'is_covered_by_credit' => $isCoveredByCredit,
                    'balance' => $balance,
                ];
            }
        }

        // Should never reach here.
        return [
            'month' => $monthNumber,
            'amount_required' => 0.0,
            'amount_paid' => null,
            'is_covered_by_credit' => false,
            'balance' => 0.0,
        ];
    }
}

