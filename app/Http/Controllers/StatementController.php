<?php

namespace App\Http\Controllers;

use App\Helpers\CurrencyHelper;
use App\Models\Expense;
use App\Services\MonthlyPaymentCalculator;
use Illuminate\Http\JsonResponse;

class StatementController extends Controller
{
    public function __construct(
        private readonly MonthlyPaymentCalculator $calculator,
    ) {
    }

    public function show(int $year, int $month): JsonResponse
    {
        abort_if($month < 1 || $month > 12, 422, 'Invalid month.');

        $user = request()->user();
        $isAdmin = ($user->role ?? 'admin') === 'admin';

        $query = Expense::query()
            ->with(['card:id,name,last_four', 'expenseType:id,name'])
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->orderByDesc('transaction_date')
            ->orderByDesc('id');

        if (! $isAdmin) {
            $query->where('user_id', $user->id);
        }

        $rows = $query->get()->map(function (Expense $expense) use ($year, $month) {
            $monthlyDue = $this->calculator->dueForMonth($expense, $year, $month);
            $paymentStatus = $monthlyDue > 0 ? 'pending' : 'paid';

            return [
                'id' => $expense->id,
                'cardName' => $expense->card?->name ?? 'Unknown',
                'cardLast4' => $expense->card?->last_four,
                'description' => $expense->description,
                'expenseTypeName' => $expense->expenseType?->name,
                'paymentType' => $expense->payment_type ?? 'full',
                'monthlyAmount' => $monthlyDue,
                'formattedMonthlyAmount' => CurrencyHelper::formatCurrency($monthlyDue),
                'paymentStatus' => $paymentStatus,
                'transactionDate' => optional($expense->transaction_date)->format('Y-m-d'),
            ];
        })->values();

        return response()->json([
            'year' => $year,
            'month' => str_pad((string) $month, 2, '0', STR_PAD_LEFT),
            'items' => $rows,
            'outstandingBalance' => round((float) $rows->sum('monthlyAmount'), 2),
            'formattedOutstandingBalance' => CurrencyHelper::formatCurrency((float) $rows->sum('monthlyAmount')),
        ]);
    }
}

