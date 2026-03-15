<?php

namespace App\Helpers;

class CurrencyHelper
{
    public static function formatCurrency(float|int|null $amount, string $currency = 'PHP'): string
    {
        if ($amount === null) {
            return '-';
        }

        return number_format(round((float) $amount, 2), 2, '.', ',');
    }
}

