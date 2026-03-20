<?php

namespace App\Models;

class Transaction extends Expense
{
    protected $table = 'expenses';

    public function scopeCurrentMonth($query)
    {
        return $query
            ->whereYear('transaction_date', now()->year)
            ->whereMonth('transaction_date', now()->month);
    }
}

