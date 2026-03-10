<?php

namespace App\Helpers;

class CurrencyHelper
{
    public static function formatCurrency(float|int|null $amount, string $currency = 'PHP'): string
    {
        if ($amount === null) {
            return '-';
        }

        $formatter = new \NumberFormatter(config('app.locale', 'en_US'), \NumberFormatter::CURRENCY);

        $formatted = $formatter->formatCurrency($amount, $currency);

        return $formatted !== false ? $formatted : sprintf('%s %.2f', $currency, $amount);
    }
}

