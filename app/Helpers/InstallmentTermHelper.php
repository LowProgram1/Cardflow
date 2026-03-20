<?php

namespace App\Helpers;

use App\Models\Expense;

class InstallmentTermHelper
{
    /**
     * Resolve the installment term months for an expense.
     *
     * Primary source: payment_term->months.
     * Fallback/correction: derive from amount / monthly_amortization when that yields a plausible integer.
     *
     * This prevents UI drift when payment_term references are out of sync but amount+monthly_amortization
     * still reflect the user-selected term.
     */
    public static function resolveInstallmentTermMonths(Expense $expense): int
    {
        $paymentTermMonths = (int) ($expense->paymentTerm?->months ?? 0);

        $monthly = (float) ($expense->monthly_amortization ?? 0);
        $amount = (float) ($expense->amount ?? 0);

        $derivedMonths = 0;
        if ($monthly > 0 && $amount > 0) {
            $derivedMonths = (int) round($amount / $monthly);
        }

        // Use derived months when it looks valid and is smaller (fixes the common "term shows too long" case).
        if ($derivedMonths >= 1 && $derivedMonths <= 120) {
            if ($paymentTermMonths >= 1 && $paymentTermMonths <= 120) {
                return $derivedMonths <= $paymentTermMonths ? $derivedMonths : $paymentTermMonths;
            }

            return $derivedMonths;
        }

        return $paymentTermMonths >= 1 ? $paymentTermMonths : 1;
    }
}

