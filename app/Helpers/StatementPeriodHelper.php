<?php

namespace App\Helpers;

use Carbon\Carbon;

class StatementPeriodHelper
{
    /**
     * Statement period: from day after statement_day in previous month, through statement_day in current month.
     * E.g. statement_day=15, year=2025, month=3 → 2025-02-16 to 2025-03-15.
     */
    public static function periodFor(int $year, int $month, int $statementDay): array
    {
        $statementDay = max(1, min(31, $statementDay));

        $prevMonthDate = Carbon::createFromDate($year, $month - 1, 1);
        $prevMonthDay = min($statementDay, (int) $prevMonthDate->daysInMonth);

        $currentMonthDate = Carbon::createFromDate($year, $month, 1);
        $currentMonthDay = min($statementDay, (int) $currentMonthDate->daysInMonth);

        $start = Carbon::createFromDate((int) $prevMonthDate->format('Y'), (int) $prevMonthDate->format('n'), $prevMonthDay)
            ->addDay()
            ->startOfDay();
        $end = Carbon::createFromDate((int) $currentMonthDate->format('Y'), (int) $currentMonthDate->format('n'), $currentMonthDay)
            ->endOfDay();

        return [$start, $end];
    }

    /**
     * @return array{0: \Carbon\Carbon, 1: \Carbon\Carbon}
     */
    public static function periodForYearMonth(string $yearMonth, int $statementDay): array
    {
        $parts = explode('-', $yearMonth);
        $year = (int) ($parts[0] ?? date('Y'));
        $month = (int) ($parts[1] ?? date('n'));

        return self::periodFor($year, $month, $statementDay);
    }

    /**
     * The statement period that contains the given date.
     *
     * @return array{0: \Carbon\Carbon, 1: \Carbon\Carbon}
     */
    public static function periodContainingDate(Carbon $date, int $statementDay): array
    {
        $statementDay = max(1, min(31, $statementDay));
        $year = (int) $date->format('Y');
        $month = (int) $date->format('n');
        [$from, $to] = self::periodFor($year, $month, $statementDay);
        if ($date->gte($from) && $date->lte($to)) {
            return [$from, $to];
        }
        if ($date->lt($from)) {
            $prev = Carbon::createFromDate($year, $month - 1, 1);

            return self::periodFor((int) $prev->format('Y'), (int) $prev->format('n'), $statementDay);
        }

        $next = Carbon::createFromDate($year, $month + 1, 1);

        return self::periodFor((int) $next->format('Y'), (int) $next->format('n'), $statementDay);
    }
}
