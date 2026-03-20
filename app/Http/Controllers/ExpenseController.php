<?php

namespace App\Http\Controllers;

use App\Helpers\CurrencyHelper;
use App\Http\Requests\Expense\ExpenseStoreRequest;
use App\Http\Requests\Expense\ExpenseUpdateRequest;
use App\Models\Card;
use App\Models\Expense;
use App\Models\ExpenseType;
use App\Models\User;
use App\Models\PaymentTerm;
use App\Helpers\InstallmentTermHelper;
use App\Services\Contracts\CardServiceInterface;
use App\Services\Contracts\ExpenseServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Response as InertiaResponse;

class ExpenseController extends Controller
{
    public function __construct(
        private readonly ExpenseServiceInterface $expenses,
        private readonly CardServiceInterface $cards,
    ) {
    }

    public function index(): InertiaResponse
    {
        $user = auth()->user();
        $isAdmin = ($user->role ?? 'admin') === 'admin';
        $userId = $isAdmin ? null : $user->id;

        $adminIds = $isAdmin ? User::query()->where('role', 'admin')->pluck('id')->all() : null;
        $result = $this->expenses->paginateWithRelations(15, $userId, $isAdmin, $adminIds);

        $items = collect($result->items())->map(function (Expense $expense) use ($isAdmin) {
            $isInstallment = ($expense->payment_type ?? 'full') === 'installment' && $expense->monthly_amortization;
            $card = $expense->card;
            $cardLabel = $isAdmin
                ? ($card && $card->last_four ? '****' . $card->last_four : '—')
                : ($card?->name ?? 'Unknown');
            $amount = (float) $expense->amount;
            $paidMonths = $expense->paid_months ?? [];
            $paidMonthAmounts = $expense->paid_month_amounts ?? [];
            $monthReqs = $isInstallment ? $this->monthRequirementsForExpense($expense) : [];
            if ($isInstallment) {
                $totalPaid = $this->effectiveTotalPaidForExpense($expense);
                $remaining = round(array_sum(array_column($monthReqs, 'balance')), 2);
            } else {
                $totalPaid = in_array(1, $paidMonths, true) ? $amount : 0.0;
                $remaining = round($amount - $totalPaid, 2);
            }

            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'created_by' => $expense->created_by,
                'user_name' => $expense->user?->name ?? '—',
                'card_id' => $expense->card_id,
                'card_name' => $cardLabel,
                'card_last_four' => $card?->last_four,
                'expense_type_id' => $expense->expense_type_id,
                'expense_type_name' => $expense->expenseType?->name,
                'description' => $expense->description,
                'amount' => $amount,
                'formatted_amount' => CurrencyHelper::formatCurrency($amount),
                'formatted_monthly' => $isInstallment ? CurrencyHelper::formatCurrency((float) $expense->monthly_amortization) : null,
                'type' => $expense->type,
                'payment_type' => $expense->payment_type ?? 'full',
                'payment_term_id' => $expense->payment_term_id,
                'payment_term_months' => $expense->paymentTerm?->months,
                'monthly_amortization' => $expense->monthly_amortization ? (float) $expense->monthly_amortization : null,
                'paid_months' => $paidMonths,
                'paid_month_amounts' => $paidMonthAmounts,
                'total_paid' => $totalPaid,
                'remaining' => $remaining,
                'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
                'month_requirements' => $monthReqs,
                'transaction_date' => optional($expense->transaction_date)->format('Y-m-d'),
                'category' => $expense->category,
            ];
        });

        if ($isAdmin) {
            $cardOptions = $this->cards->allActiveForExpenseLinking(true)->map(function (Card $card) {
                $userName = $card->user?->name ?? 'User #' . $card->user_id;
                $masked = $card->last_four ? '****' . $card->last_four : '****';
                return [
                    'id' => $card->id,
                    'label' => $userName . ' — ' . $masked,
                ];
            });
        } else {
            $cardOptions = $this->cards->allActive($userId)->map(function (Card $card) {
                $typeName = $card->cardType?->name ?? 'Card';
                return [
                    'id' => $card->id,
                    'label' => $card->name . ($card->last_four ? ' •••• ' . $card->last_four : '') . ' · ' . $typeName,
                ];
            });
        }

        $users = $isAdmin
            ? User::query()->orderBy('name')->get(['id', 'name'])->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
            : [['id' => $user->id, 'name' => $user->name]];

        return $this->inertia('Expenses/Index', [
            'expenses' => $items,
            'cardOptions' => $cardOptions,
            'users' => $users,
            'isAdmin' => $isAdmin,
            'expenseTypes' => ExpenseType::query()->orderBy('name')->get(['id', 'name']),
            'paymentTerms' => PaymentTerm::query()->orderBy('months')->get(['id', 'months']),
            'pagination' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function store(ExpenseStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = auth()->user();
        $isAdmin = ($user->role ?? 'admin') === 'admin';
        if (! $isAdmin) {
            $data['user_id'] = $user->id;
        } else {
            $data['user_id'] = (int) ($data['user_id'] ?? $user->id);
        }

        Gate::authorize('assignCardForExpense', [Expense::class, (int) $data['user_id'], (int) $data['card_id']]);
        $data['type'] = $data['type'] ?? 'expense';

        if (($data['payment_type'] ?? 'full') === 'installment' && ! empty($data['payment_term_id']) && ! empty($data['monthly_amortization'])) {
            $term = PaymentTerm::find($data['payment_term_id']);
            if ($term) {
                $data['amount'] = $term->months * (float) $data['monthly_amortization'];
            }
        }

        $data['created_by'] = $user->id;
        $this->expenses->create($data);

        return redirect()->route('expenses.index')->with('flash', [
            'type' => 'success',
            'message' => 'Entry logged.',
        ]);
    }

    public function update(ExpenseUpdateRequest $request, Expense $expense): RedirectResponse
    {
        $user = auth()->user();
        $isAdmin = ($user->role ?? 'admin') === 'admin';
        if (! $isAdmin && $expense->user_id != $user->id) {
            abort(403, 'You can only edit your own expenses.');
        }
        $data = $request->validated();
        if (! $isAdmin) {
            $data['user_id'] = $user->id;
        } else {
            $data['user_id'] = (int) ($data['user_id'] ?? $expense->user_id);
        }
        Gate::authorize('assignCardForExpense', [Expense::class, (int) $data['user_id'], (int) $data['card_id']]);
        $data['type'] = $data['type'] ?? $expense->type ?? 'expense';

        if (($data['payment_type'] ?? 'full') === 'installment' && ! empty($data['payment_term_id']) && ! empty($data['monthly_amortization'])) {
            $term = PaymentTerm::find($data['payment_term_id']);
            if ($term) {
                $data['amount'] = $term->months * (float) $data['monthly_amortization'];
                // Validate: new term months must not be less than already paid months
                $paidCount = count($expense->paid_months ?? []);
                if ($paidCount > $term->months) {
                    return redirect()->back()->withErrors([
                        'payment_term_id' => "You have already marked {$paidCount} month(s) as paid. The term cannot be reduced to {$term->months} months.",
                    ])->withInput()->with('flash', [
                        'type' => 'error',
                        'message' => "You have already marked {$paidCount} month(s) as paid. The term cannot be reduced to {$term->months} months.",
                    ])->with('openModal', ['context' => 'expenses', 'id' => $expense->id]);
                }
            }
        }

        $this->expenses->update($expense, $data);

        return redirect()->route('expenses.index')->with('flash', [
            'type' => 'success',
            'message' => 'Entry updated.',
        ]);
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        $user = auth()->user();
        if (($user->role ?? 'admin') !== 'admin' && $expense->user_id != $user->id) {
            abort(403, 'You can only delete your own expenses.');
        }
        $this->expenses->delete($expense);

        return redirect()->route('expenses.index')->with('flash', [
            'type' => 'delete',
            'message' => 'Entry removed.',
        ]);
    }

    public function togglePaidMonth(Request $request, Expense $expense): RedirectResponse|JsonResponse
    {
        $user = auth()->user();
        if (($user->role ?? 'admin') !== 'admin' && $expense->user_id != $user->id) {
            abort(403, 'You can only update your own expense payments.');
        }
        $request->validate(['month' => ['required', 'integer', 'min:1', 'max:120']]);
        $month = (int) $request->input('month');

        $isFull = ($expense->payment_type ?? 'full') === 'full';

        if ($isFull) {
            // Full payment: only month 1, toggle paid state
            $paid = in_array(1, $expense->paid_months ?? [], true)
                ? []
                : [1];

            $expense->update(['paid_months' => $paid, 'last_paid_at' => $paid ? now() : $expense->last_paid_at]);

            if ($request->wantsJson()) {
                return response()->json(['paid_months' => $paid]);
            }

            return redirect()->back()->with('flash', ['type' => 'success', 'message' => 'Payment status updated.']);
        }

        // Installment
        if (! $expense->payment_term_id) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Not an installment expense.'], 422);
            }

            return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => 'Not an installment expense.']);
        }

        // Installment: require previous months paid; when marking paid, require amount_paid >= amount_required
        $term = $expense->paymentTerm;
        $termMonths = $term ? InstallmentTermHelper::resolveInstallmentTermMonths($expense) : 0;
        if (! $term || $month < 1) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Invalid month for this term.'], 422);
            }

            return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => 'Invalid month.']);
        }

        $amounts = $expense->paid_month_amounts ?? [];
        if (empty($amounts) && ! empty($expense->paid_months)) {
            foreach ($expense->paid_months as $m) {
                $amounts[(int) $m] = (float) $expense->monthly_amortization;
            }
        }
        // Normalize to integer keys and float values
        $amounts = array_map(
            fn ($v) => round((float) $v, 2),
            array_combine(array_map('intval', array_keys($amounts)), array_values($amounts))
        );
        $amounts = array_filter($amounts, fn ($v) => $v > 0);
        $paidMonths = array_values(array_keys($amounts));
        sort($paidMonths);

        $isExtraPayment = $month > $termMonths;

        if (in_array($month, $paidMonths, true)) {
            // Unpay: remove this month
            unset($amounts[$month]);
            $paidMonths = array_values(array_keys($amounts));
            sort($paidMonths);
            $expense->update([
                'paid_month_amounts' => $amounts,
                'paid_months' => $paidMonths,
                'last_paid_at' => count($paidMonths) > 0 ? now() : $expense->last_paid_at,
            ]);

            if ($request->wantsJson()) {
                $fresh = $expense->fresh();
                $reqs = $this->monthRequirementsForExpense($fresh);
                $remaining = round(array_sum(array_column($reqs, 'balance')), 2);
                $effectivePaid = $this->effectiveTotalPaidForExpense($fresh);
                return response()->json([
                    'paid_months' => $paidMonths,
                    'paid_month_amounts' => $amounts,
                    'month_requirements' => $reqs,
                    'remaining' => $remaining,
                    'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
                    'total_paid' => $effectivePaid,
                    'formatted_total_paid' => CurrencyHelper::formatCurrency($effectivePaid),
                ]);
            }

            return redirect()->back()->with('flash', ['type' => 'success', 'message' => 'Payment status updated.']);
        }

        if (! $isExtraPayment) {
            // Mark month as paid: all previous months must be effectively paid (user paid or covered by credit)
            for ($prev = 1; $prev < $month; $prev++) {
                if (! $this->isMonthEffectivelyPaid($expense, $prev)) {
                    if ($request->wantsJson()) {
                        return response()->json(['message' => "Pay month {$prev} first."], 422);
                    }

                    return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => "Pay month {$prev} first."]);
                }
            }
            $amountRequired = $this->amountRequiredForMonth($expense, $month);
            if ($amountRequired <= 0) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'This month is already covered by prior credit. No payment needed.'], 422);
                }
                return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => 'This month is already covered by prior credit.']);
            }
        } else {
            // Extra payment (month > term): all regular months must be effectively paid first
            for ($prev = 1; $prev <= $termMonths; $prev++) {
                if (! $this->isMonthEffectivelyPaid($expense, $prev)) {
                    if ($request->wantsJson()) {
                        return response()->json(['message' => 'All installment months must be paid before recording an extra payment.'], 422);
                    }

                    return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => 'Complete all months first.']);
                }
            }
            $amountRequired = 0.0;
        }

        $amountPaid = $request->input('amount_paid');
        if ($amountPaid === null || $amountPaid === '') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Amount paid is required when marking a month as paid.', 'amount_required' => $amountRequired], 422);
            }

            return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => 'Amount paid is required.']);
        }
        $amountPaid = (float) $amountPaid;
        if (! $isExtraPayment) {
            // Installment month payment must be exact to keep the schedule deterministic.
            if (abs($amountPaid - $amountRequired) > 0.009) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'message' => 'Amount paid must exactly match the amount due for this month.',
                        'amount_required' => $amountRequired,
                        'formatted_amount_required' => CurrencyHelper::formatCurrency($amountRequired),
                    ], 422);
                }

                return redirect()->route('expenses.index')->with('flash', [
                    'type' => 'error',
                    'message' => 'Amount paid must exactly match ' . CurrencyHelper::formatCurrency($amountRequired) . '.',
                ]);
            }
        } elseif ($amountPaid < $amountRequired) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Amount paid cannot be lower than the amount due.',
                    'amount_required' => $amountRequired,
                    'formatted_amount_required' => CurrencyHelper::formatCurrency($amountRequired),
                ], 422);
            }

            return redirect()->route('expenses.index')->with('flash', [
                'type' => 'error',
                'message' => 'Amount paid cannot be lower than ' . CurrencyHelper::formatCurrency($amountRequired) . '.',
            ]);
        }

        $amounts[$month] = $amountPaid;
        $paidMonths = array_values(array_keys($amounts));
        sort($paidMonths);

        $expense->update([
            'paid_month_amounts' => $amounts,
            'paid_months' => $paidMonths,
            'last_paid_at' => now(),
        ]);

        if ($request->wantsJson()) {
            $fresh = $expense->fresh();
            $reqs = $this->monthRequirementsForExpense($fresh);
            $remaining = round(array_sum(array_column($reqs, 'balance')), 2);
            $effectivePaid = $this->effectiveTotalPaidForExpense($fresh);
            return response()->json([
                'paid_months' => $paidMonths,
                'paid_month_amounts' => $amounts,
                'month_requirements' => $reqs,
                'remaining' => $remaining,
                'formatted_remaining' => CurrencyHelper::formatCurrency($remaining),
                'total_paid' => $effectivePaid,
                'formatted_total_paid' => CurrencyHelper::formatCurrency($effectivePaid),
                'message' => 'Payment recorded successfully.',
            ]);
        }

        return redirect()->back()->with('flash', ['type' => 'success', 'message' => 'Payment recorded.']);
    }

    /**
     * Sequential installment waterfall:
     * Row[n].Balance = (Baseline_Amortization - Carry_From_n-1) - Direct_Payment_n.
     * Carry to n+1 = only overpayment that exceeds 100% of monthly (so partial payment does not zero out next month's due).
     *
     * @return array<int, array{month: int, amount_required: float, formatted_amount_required: string, amount_paid: float|null, formatted_amount_paid: string|null, is_covered_by_credit: bool, balance: float}>
     */
    private function monthRequirementsForExpense(Expense $expense): array
    {
        if (($expense->payment_type ?? 'full') !== 'installment' || ! $expense->paymentTerm) {
            return [];
        }
        $monthly = round((float) $expense->monthly_amortization, 2);
        $term = InstallmentTermHelper::resolveInstallmentTermMonths($expense);
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

        $requirements = [];
        $carriedCredit = 0.0;

        for ($m = 1; $m <= $term; $m++) {
            $dueThisMonth = round(max(0.0, $monthly - $carriedCredit), 2);
            $userPaid = isset($amounts[$m]) ? $amounts[$m] : null;
            $isCoveredByCredit = false;
            $amountPaid = null;
            $balance = $dueThisMonth;

            $effectivePaidThisMonth = 0.0;
            if ($userPaid !== null) {
                $amountPaid = $userPaid;
                $effectivePaidThisMonth = $userPaid;
                $balance = round(max(0.0, $dueThisMonth - $userPaid), 2);
                $carriedCredit = round(max(0.0, $userPaid - $monthly), 2);
            } else {
                if ($dueThisMonth <= 0) {
                    $isCoveredByCredit = true;
                    $amountPaid = 0.0;
                    $balance = 0.0;
                    $consumed = min($carriedCredit, $monthly);
                    $effectivePaidThisMonth = round($consumed, 2);
                    $carriedCredit = round($carriedCredit - $consumed, 2);
                } else {
                    $carriedCredit = 0.0;
                }
            }

            $requirements[] = [
                'month' => $m,
                'amount_required' => $dueThisMonth,
                'formatted_amount_required' => CurrencyHelper::formatCurrency($dueThisMonth),
                'amount_paid' => $amountPaid,
                'formatted_amount_paid' => $amountPaid !== null ? CurrencyHelper::formatCurrency($amountPaid) : ($isCoveredByCredit ? CurrencyHelper::formatCurrency(0) . ' (credit)' : null),
                'is_covered_by_credit' => $isCoveredByCredit,
                'balance' => $balance,
                'effective_paid' => $effectivePaidThisMonth,
            ];
        }

        return $requirements;
    }

    /**
     * Amount required for a given month using the same waterfall (carry forward through prior months).
     */
    private function amountRequiredForMonth(Expense $expense, int $month): float
    {
        if (($expense->payment_type ?? 'full') !== 'installment' || ! $expense->paymentTerm || $month < 1) {
            return 0.0;
        }
        $reqs = $this->monthRequirementsForExpense($expense);
        foreach ($reqs as $r) {
            if ((int) $r['month'] === $month) {
                return (float) $r['amount_required'];
            }
        }
        return 0.0;
    }

    /**
     * Whether a month is effectively paid (user recorded a payment or it is covered by prior credit).
     */
    private function isMonthEffectivelyPaid(Expense $expense, int $month): bool
    {
        $reqs = $this->monthRequirementsForExpense($expense);
        foreach ($reqs as $r) {
            if ((int) $r['month'] === $month) {
                return $r['amount_paid'] !== null || ! empty($r['is_covered_by_credit']);
            }
        }
        return false;
    }

    /**
     * Effective total paid from waterfall (user payments + months covered by credit).
     */
    private function effectiveTotalPaidForExpense(Expense $expense): float
    {
        if (($expense->payment_type ?? 'full') !== 'installment' || ! $expense->paymentTerm) {
            $amount = (float) $expense->amount;
            $paidMonths = $expense->paid_months ?? [];
            return in_array(1, $paidMonths, true) ? $amount : 0.0;
        }
        $monthly = round((float) $expense->monthly_amortization, 2);
        $term = InstallmentTermHelper::resolveInstallmentTermMonths($expense);
        $reqs = $this->monthRequirementsForExpense($expense);
        $total = 0.0;
        foreach ($reqs as $r) {
            if (isset($r['effective_paid']) && (float) $r['effective_paid'] > 0) {
                $total += (float) $r['effective_paid'];
            }
        }
        $amounts = $expense->paid_month_amounts ?? [];
        $amounts = array_map(
            fn ($v) => round((float) $v, 2),
            array_combine(array_map('intval', array_keys($amounts)), array_values($amounts))
        );
        foreach ($amounts as $m => $amt) {
            if ($m > $term && $amt > 0) {
                $total += $amt;
            }
        }
        return round($total, 2);
    }
}

