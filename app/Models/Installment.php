<?php

namespace App\Models;

class Installment extends Expense
{
    protected $table = 'expenses';

    public function scopeInstallment($query)
    {
        return $query->where('payment_type', 'installment');
    }

    public function scopeCurrentMonth($query)
    {
        return $query
            ->whereYear('transaction_date', now()->year)
            ->whereMonth('transaction_date', now()->month);
    }
}

