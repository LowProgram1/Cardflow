<?php

namespace App\Http\Controllers;

use App\Helpers\CurrencyHelper;
use App\Http\Requests\Expense\ExpenseStoreRequest;
use App\Http\Requests\Expense\ExpenseUpdateRequest;
use App\Models\Card;
use App\Models\Expense;
use App\Models\ExpenseType;
use App\Models\PaymentTerm;
use App\Models\User;
use App\Services\Contracts\CardServiceInterface;
use App\Services\Contracts\ExpenseServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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

        $result = $this->expenses->paginateWithRelations(15, $userId);

        $items = collect($result->items())->map(function (Expense $expense) {
            $isInstallment = ($expense->payment_type ?? 'full') === 'installment' && $expense->monthly_amortization;
            return [
                'id' => $expense->id,
                'user_id' => $expense->user_id,
                'user_name' => $expense->user?->name ?? '—',
                'card_id' => $expense->card_id,
                'card_name' => $expense->card?->name ?? 'Unknown',
                'card_last_four' => $expense->card?->last_four,
                'expense_type_id' => $expense->expense_type_id,
                'expense_type_name' => $expense->expenseType?->name,
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
                'formatted_amount' => CurrencyHelper::formatCurrency((float) $expense->amount),
                'formatted_monthly' => $isInstallment ? CurrencyHelper::formatCurrency((float) $expense->monthly_amortization) : null,
                'type' => $expense->type,
                'payment_type' => $expense->payment_type ?? 'full',
                'payment_term_id' => $expense->payment_term_id,
                'payment_term_months' => $expense->paymentTerm?->months,
                'monthly_amortization' => $expense->monthly_amortization ? (float) $expense->monthly_amortization : null,
                'paid_months' => $expense->paid_months ?? [],
                'paid_month_amounts' => $expense->paid_month_amounts ?? [],
                'month_requirements' => $this->monthRequirementsForExpense($expense),
                'transaction_date' => optional($expense->transaction_date)->format('Y-m-d'),
                'category' => $expense->category,
            ];
        });

        $cardOptions = $this->cards->allActive($userId)->map(function (Card $card) {
            $typeName = $card->cardType?->name ?? 'Card';
            return [
                'id' => $card->id,
                'label' => $card->name . ($card->last_four ? ' •••• ' . $card->last_four : '') . ' · ' . $typeName,
            ];
        });

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
        if (($user->role ?? 'admin') !== 'admin') {
            $data['user_id'] = $user->id;
        } else {
            $data['user_id'] = (int) ($data['user_id'] ?? $user->id);
        }
        $data['type'] = $data['type'] ?? 'expense';

        if (($data['payment_type'] ?? 'full') === 'installment' && ! empty($data['payment_term_id']) && ! empty($data['monthly_amortization'])) {
            $term = PaymentTerm::find($data['payment_term_id']);
            if ($term) {
                $data['amount'] = $term->months * (float) $data['monthly_amortization'];
            }
        }

        $this->expenses->create($data);

        return redirect()->route('expenses.index')->with('flash', [
            'type' => 'success',
            'message' => 'Entry logged.',
        ]);
    }

    public function update(ExpenseUpdateRequest $request, Expense $expense): RedirectResponse
    {
        $user = auth()->user();
        if (($user->role ?? 'admin') !== 'admin' && $expense->user_id != $user->id) {
            abort(403, 'You can only edit your own expenses.');
        }
        $data = $request->validated();
        if (($user->role ?? 'admin') !== 'admin') {
            $data['user_id'] = $user->id;
        } else {
            $data['user_id'] = (int) ($data['user_id'] ?? $expense->user_id);
        }
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
        if (! $term || $month > $term->months) {
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
                return response()->json([
                    'paid_months' => $paidMonths,
                    'paid_month_amounts' => $amounts,
                    'month_requirements' => $this->monthRequirementsForExpense($expense->fresh()),
                ]);
            }

            return redirect()->back()->with('flash', ['type' => 'success', 'message' => 'Payment status updated.']);
        }

        // Mark month as paid: require amount_paid >= amount_required, and previous months must be paid
        for ($prev = 1; $prev < $month; $prev++) {
            if (! in_array($prev, $paidMonths, true)) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => "Pay month {$prev} first."], 422);
                }

                return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => "Pay month {$prev} first."]);
            }
        }

        $monthly = round((float) $expense->monthly_amortization, 2);
        $carry = 0.0;
        for ($m = 1; $m < $month; $m++) {
            $amountRequired = round(max(0.0, $monthly - $carry), 2);
            $paid = isset($amounts[$m]) ? $amounts[$m] : 0.0;
            $consumed = $monthly - $amountRequired;
            $overpayment = max(0.0, $paid - $amountRequired);
            $carry = round($carry - $consumed + $overpayment, 2);
        }
        $amountRequired = round(max(0.0, $monthly - $carry), 2);

        $amountPaid = $request->input('amount_paid');
        if ($amountPaid === null || $amountPaid === '') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Amount paid is required when marking a month as paid.', 'amount_required' => $amountRequired], 422);
            }

            return redirect()->route('expenses.index')->with('flash', ['type' => 'error', 'message' => 'Amount paid is required.']);
        }
        $amountPaid = (float) $amountPaid;
        if ($amountPaid < $amountRequired) {
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
            return response()->json([
                'paid_months' => $paidMonths,
                'paid_month_amounts' => $amounts,
                'month_requirements' => $this->monthRequirementsForExpense($expense->fresh()),
            ]);
        }

        return redirect()->back()->with('flash', ['type' => 'success', 'message' => 'Payment recorded.']);
    }

    /**
     * For installment expenses: compute amount_required per month (monthly minus prior overpayments).
     *
     * @return array<int, array{month: int, amount_required: float, formatted_amount_required: string, amount_paid: float|null, formatted_amount_paid: string|null}>
     */
    private function monthRequirementsForExpense(Expense $expense): array
    {
        if (($expense->payment_type ?? 'full') !== 'installment' || ! $expense->paymentTerm) {
            return [];
        }
        $monthly = round((float) $expense->monthly_amortization, 2);
        $term = (int) $expense->paymentTerm->months;
        $amounts = $expense->paid_month_amounts ?? [];
        // Normalize to integer keys and float values (JSON may have string keys)
        $amounts = array_map(
            fn ($v) => round((float) $v, 2),
            array_combine(array_map('intval', array_keys($amounts)), array_values($amounts))
        );
        $amounts = array_filter($amounts, fn ($v) => $v > 0);
        if (empty($amounts) && ! empty($expense->paid_months)) {
            foreach ($expense->paid_months as $m) {
                $amounts[(int) $m] = $monthly;
            }
        }
        $requirements = [];
        $carry = 0.0;
        for ($m = 1; $m <= $term; $m++) {
            $amountRequired = round(max(0.0, $monthly - $carry), 2);
            $amountPaid = isset($amounts[$m]) ? $amounts[$m] : null;
            if ($amountPaid !== null) {
                // Consume carry used to reduce this month's due, then add this month's overpayment
                $consumed = $monthly - $amountRequired;
                $overpayment = max(0.0, $amountPaid - $amountRequired);
                $carry = round($carry - $consumed + $overpayment, 2);
            }
            $requirements[] = [
                'month' => $m,
                'amount_required' => $amountRequired,
                'formatted_amount_required' => CurrencyHelper::formatCurrency($amountRequired),
                'amount_paid' => $amountPaid,
                'formatted_amount_paid' => $amountPaid !== null ? CurrencyHelper::formatCurrency($amountPaid) : null,
            ];
        }

        return $requirements;
    }
}

