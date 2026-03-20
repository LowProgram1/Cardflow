<?php

namespace App\Http\Controllers;

use App\Helpers\CurrencyHelper;
use App\Helpers\StatementPeriodHelper;
use App\Http\Requests\Card\CardStoreRequest;
use App\Http\Requests\Card\CardUpdateRequest;
use App\Models\Card;
use App\Models\CardType;
use App\Models\Expense;
use App\Services\Contracts\CardServiceInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response as InertiaResponse;

class CardController extends Controller
{
    public function __construct(
        private readonly CardServiceInterface $cards,
    ) {
    }

    public function index(): InertiaResponse
    {
        $user = auth()->user();
        $userId = (int) $user->id;

        $result = $this->cards->paginate(10, $userId);

        $items = collect($result->items())->map(function (Card $card) {
            return [
                'id' => $card->id,
                'bank_name' => $card->bank_name,
                'card_type_id' => $card->card_type_id,
                'card_type_name' => $card->cardType?->name,
                'name' => $card->name,
                'last_four' => $card->last_four,
                'limit' => (float) $card->limit,
                'formatted_limit' => CurrencyHelper::formatCurrency((float) $card->limit),
                'statement_day' => $card->statement_day,
                'due_day' => $card->due_day,
                'is_active' => $card->is_active,
                'color' => $card->color ?? 'blue',
                'expenses_count' => $card->expenses_count ?? 0,
            ];
        });

        return $this->inertia('Cards/Index', [
            'cards' => $items,
            'cardTypes' => CardType::query()->orderBy('name')->get(['id', 'name']),
            'viewOnly' => false,
            'pagination' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
            ],
        ]);
    }

    public function store(CardStoreRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id'] = (int) auth()->id();

        $this->cards->create($data);

        return redirect()->route('cards.index')->with('flash', [
            'type' => 'success',
            'message' => 'Card created successfully.',
        ]);
    }

    public function update(CardUpdateRequest $request, Card $card): RedirectResponse
    {
        if ($card->user_id !== (int) auth()->id()) {
            abort(403, 'You can only edit your own cards.');
        }
        $data = $request->validated();
        $this->cards->update($card, $data);

        return redirect()->route('cards.index')->with('flash', [
            'type' => 'success',
            'message' => 'Card updated successfully.',
        ]);
    }

    public function destroy(Card $card): RedirectResponse
    {
        if ($card->user_id !== (int) auth()->id()) {
            abort(403, 'You can only delete your own cards.');
        }
        $this->cards->delete($card);

        return redirect()->route('cards.index')->with('flash', [
            'type' => 'delete',
            'message' => 'Card removed.',
        ]);
    }

    /**
     * Get transactions for a card. Optional month (YYYY-MM) scopes to statement period.
     */
    public function transactions(Request $request, Card $card): JsonResponse
    {
        if ($card->user_id !== (int) auth()->id()) {
            abort(403, 'You can only view transactions for your own cards.');
        }
        $month = $request->input('month');
        $from = null;
        $to = null;

        if ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $statementDay = (int) ($card->statement_day ?? 1);
            if ($statementDay < 1) {
                $statementDay = 1;
            }
            if ($statementDay > 31) {
                $statementDay = 31;
            }
            [$from, $to] = StatementPeriodHelper::periodForYearMonth($month, $statementDay);
        }

        $expenses = $this->cards->getTransactionsForCard($card, $from, $to);

        $items = $expenses->map(function ($expense) {
            if (is_array($expense)) {
                return [
                    'id' => $expense['id'] ?? null,
                    'expense_id' => $expense['expense_id'] ?? null,
                    'month_number' => $expense['month_number'] ?? null,
                    'description' => $expense['description'] ?? null,
                    'amount' => (float) ($expense['amount'] ?? 0),
                    'formatted_amount' => $expense['formatted_amount'] ?? CurrencyHelper::formatCurrency((float) ($expense['amount'] ?? 0)),
                    'type' => $expense['type'] ?? null,
                    'transaction_date' => $expense['transaction_date'] ?? null,
                    'expense_type_name' => $expense['expense_type_name'] ?? null,
                    'user_name' => $expense['user_name'] ?? null,
                ];
            }

            return [
                'id' => $expense->id,
                'expense_id' => $expense->id,
                'month_number' => null,
                'description' => $expense->description,
                'amount' => (float) $expense->amount,
                'formatted_amount' => CurrencyHelper::formatCurrency((float) $expense->amount),
                'type' => $expense->type,
                'transaction_date' => $expense->transaction_date?->format('Y-m-d'),
                'expense_type_name' => $expense->expenseType?->name,
                'user_name' => $expense->user?->name,
            ];
        });

        return response()->json(['transactions' => $items->values()->all()]);
    }

    /**
     * Get list of statement months (YYYY-MM) that have at least one transaction for this card.
     */
    public function statementMonths(Card $card): JsonResponse
    {
        if ($card->user_id !== (int) auth()->id()) {
            abort(403, 'You can only view statement months for your own cards.');
        }

        try {
            $months = $this->cards->getStatementMonthsForCard($card);
            return response()->json(['statement_months' => $months]);
        } catch (\Throwable $e) {
            report($e);
            // Return 200 so the UI shows an empty list + the error message instead of failing silently.
            return response()->json([
                'statement_months' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Statement of Account: HTML view for the given month (statement period). User can print/save as PDF.
     */
    public function statement(Request $request, Card $card)
    {
        // Keep SOA generation in one file path by rendering through statementPdf().
        return $this->statementPdf($request, $card);
    }

    /**
     * Statement of Account as PDF (A4), for display in modal or download.
     */
    public function statementPdf(Request $request, Card $card)
    {
        if ($card->user_id !== (int) auth()->id()) {
            abort(403, 'You can only view statements for your own cards.');
        }
        $month = $request->input('month', now()->format('Y-m'));
        if (! preg_match('/^\d{4}-\d{2}$/', (string) $month)) {
            abort(422, 'Invalid statement month format.');
        }
        if (! $this->isSoaMonthAvailable($card, (string) $month)) {
            abort(422, 'SOA is not yet available for this month. Wait for the statement date.');
        }
        $payload = $this->buildStatementPayload($card, $month);

        $pdf = Pdf::loadView('cards.statement-pdf', [
            'card' => $payload['card'],
            'userName' => $payload['userName'],
            'transactions' => $payload['transactions'],
            'paymentHistory' => $payload['paymentHistory'],
            'statementMonthLabel' => $payload['statementMonthLabel'],
            'periodStart' => $payload['periodStart'],
            'periodEnd' => $payload['periodEnd'],
            'dueDateLabel' => $payload['dueDateLabel'],
            'txnTotal' => $payload['txnTotal'],
            'paymentTotal' => $payload['paymentTotal'],
            'netDue' => $payload['netDue'],
        ])->setPaper('a4');

        return $pdf->stream('statement-' . $month . '.pdf');
    }

    private function buildStatementPayload(Card $card, string $month): array
    {
        $card->load('user');
        $statementDay = (int) ($card->statement_day ?? 1);
        $statementDay = max(1, min(31, $statementDay));

        // SOA month content is based on the selected month itself (month-scoped),
        // so Monthly Installment and Full Payment for that month are fully included.
        $from = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $to = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        $selectedMonthStart = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $selectedMonthEnd = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        $expenseRows = collect();

        // 1) Installment monthly charges (always listed for the selected month if month is covered)
        $installmentExpenses = Expense::query()
            ->where('card_id', $card->id)
            ->where('type', 'expense')
            ->where('payment_type', 'installment')
            ->whereNotNull('transaction_date')
            ->with(['paymentTerm', 'expenseType'])
            ->get();

        foreach ($installmentExpenses as $expense) {
            if (! $expense->transaction_date || ! $expense->paymentTerm) {
                continue;
            }
            $txDate = Carbon::parse($expense->transaction_date);
            if ($txDate->lt($selectedMonthStart) || $txDate->gt($selectedMonthEnd)) {
                continue;
            }
            $start = $txDate->copy()->startOfMonth();
            $term = (int) ($expense->paymentTerm->months ?? 0);
            if ($term <= 0) {
                continue;
            }

            $startKey = ((int) $start->format('Y')) * 12 + (int) $start->format('n');
            $selKey = ((int) $selectedMonthStart->format('Y')) * 12 + (int) $selectedMonthStart->format('n');
            $monthNo = ($selKey - $startKey) + 1;
            if ($monthNo < 1 || $monthNo > $term) {
                continue;
            }

            $dueAmount = round((float) ($expense->monthly_amortization ?? 0), 2);
            $paidAmounts = $expense->paid_month_amounts ?? [];
            $paidAmount = isset($paidAmounts[$monthNo]) ? round((float) $paidAmounts[$monthNo], 2) : 0.0;
            if ($paidAmount <= 0 && in_array($monthNo, $expense->paid_months ?? [], true)) {
                $paidAmount = $dueAmount;
            }

            $description = ($expense->description ?? $expense->expenseType?->name ?? 'Installment') . ' (month ' . $monthNo . ')';
            $expenseRows->push([
                'expense_id' => $expense->id,
                'date' => $txDate->format('M j, Y'),
                'description' => $description,
                'type' => 'installment',
                'status' => $paidAmount > 0 ? 'Paid' : 'Unpaid',
                'amount' => $dueAmount,
                'formatted_amount' => CurrencyHelper::formatCurrency($dueAmount),
                'paid_amount' => $paidAmount,
                'formatted_paid_amount' => CurrencyHelper::formatCurrency($paidAmount),
            ]);
        }

        // 2) Full-payment expenses posted in the selected month
        $fullExpenses = Expense::query()
            ->where('card_id', $card->id)
            ->where('type', 'expense')
            ->where('payment_type', 'full')
            ->whereDate('transaction_date', '>=', $selectedMonthStart->toDateString())
            ->whereDate('transaction_date', '<=', $selectedMonthEnd->toDateString())
            ->with(['expenseType'])
            ->get();

        foreach ($fullExpenses as $expense) {
            $dueAmount = round((float) ($expense->amount ?? 0), 2);
            $isPaid = in_array(1, $expense->paid_months ?? [], true);
            $paidAmount = $isPaid ? $dueAmount : 0.0;
            $expenseRows->push([
                'expense_id' => $expense->id,
                'date' => optional($expense->transaction_date)->format('M j, Y'),
                'description' => $expense->description ?? $expense->expenseType?->name ?? 'Full payment',
                'type' => 'full',
                'status' => $isPaid ? 'Paid' : 'Unpaid',
                'amount' => $dueAmount,
                'formatted_amount' => CurrencyHelper::formatCurrency($dueAmount),
                'paid_amount' => $paidAmount,
                'formatted_paid_amount' => CurrencyHelper::formatCurrency($paidAmount),
            ]);
        }

        // 2b) Bank-style safety net:
        // include any posted expense row in the selected month that is not yet represented above.
        $postedMonthExpenses = Expense::query()
            ->where('card_id', $card->id)
            ->where('type', 'expense')
            ->whereDate('transaction_date', '>=', $selectedMonthStart->toDateString())
            ->whereDate('transaction_date', '<=', $selectedMonthEnd->toDateString())
            ->with(['expenseType'])
            ->get();

        $existingExpenseIds = $expenseRows
            ->map(fn ($r) => (int) ($r['expense_id'] ?? 0))
            ->filter(fn ($id) => $id > 0)
            ->values()
            ->all();

        foreach ($postedMonthExpenses as $expense) {
            if (in_array((int) $expense->id, $existingExpenseIds, true)) {
                continue;
            }
            $amount = round((float) ($expense->amount ?? 0), 2);
            $status = in_array(1, $expense->paid_months ?? [], true) ? 'Paid' : 'Unpaid';
            $paidAmount = $status === 'Paid' ? $amount : 0.0;
            $expenseRows->push([
                'expense_id' => $expense->id,
                'date' => optional($expense->transaction_date)->format('M j, Y'),
                'description' => $expense->description ?? $expense->expenseType?->name ?? 'Expense',
                'type' => (string) ($expense->payment_type ?? 'expense'),
                'status' => $status,
                'amount' => $amount,
                'formatted_amount' => CurrencyHelper::formatCurrency($amount),
                'paid_amount' => $paidAmount,
                'formatted_paid_amount' => CurrencyHelper::formatCurrency($paidAmount),
            ]);
        }

        $rows = $expenseRows->values()->all();

        // 3) Payments posted in selected month (credit entries)
        $paymentHistoryRaw = Expense::query()
            ->where('card_id', $card->id)
            ->where('type', 'payment')
            ->whereDate('transaction_date', '>=', $selectedMonthStart->toDateString())
            ->whereDate('transaction_date', '<=', $selectedMonthEnd->toDateString())
            ->with(['expenseType'])
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get()
            ->map(function ($p) {
                $amount = round((float) ($p->amount ?? 0), 2);
                return [
                    'date' => optional($p->transaction_date)->format('M j, Y'),
                    'description' => $p->description ?? $p->expenseType?->name ?? 'Payment',
                    'amount' => $amount,
                    'formatted_amount' => CurrencyHelper::formatCurrency($amount),
                ];
            })
            ->values()
            ->all();
        $paymentHistory = $paymentHistoryRaw;

        // SOA transaction history: selected statement month scope (expenses + payment rows).
        $timeline = collect();
        foreach ($rows as $row) {
            $type = (string) ($row['type'] ?? 'expense');
            $amount = (float) ($row['amount'] ?? 0);
            $paidAmount = (float) ($row['paid_amount'] ?? 0);
            $status = (string) ($row['status'] ?? ($amount <= 0 ? 'Paid' : 'Unpaid'));
            $dateRaw = (string) ($row['date'] ?? '');
            $dateKey = null;
            if ($dateRaw !== '') {
                try {
                    $dateKey = Carbon::parse($dateRaw)->format('Y-m-d');
                } catch (\Throwable $e) {
                    $dateKey = null;
                }
            }
            $timeline->push([
                'date' => $dateRaw ?: '—',
                'description' => $row['description'] ?? '—',
                'type' => 'expense',
                'status' => $status,
                'amount' => $amount,
                'formatted_amount' => $row['formatted_amount'] ?? CurrencyHelper::formatCurrency($amount),
                'paid_amount' => 0.0,
                'formatted_paid_amount' => CurrencyHelper::formatCurrency(0),
                'date_key' => $dateKey,
                'sort_group' => 1,
            ]);

            // Bank-style ledger row: show paid part as a separate transaction line.
            if ($paidAmount > 0) {
                $timeline->push([
                    'date' => $dateRaw ?: '—',
                    'description' => 'Payment · ' . ($row['description'] ?? 'Expense'),
                    'type' => 'paid',
                    'status' => 'Paid',
                    'amount' => 0.0,
                    'formatted_amount' => CurrencyHelper::formatCurrency(0),
                    'paid_amount' => $paidAmount,
                    'formatted_paid_amount' => $row['formatted_paid_amount'] ?? CurrencyHelper::formatCurrency($paidAmount),
                    'date_key' => $dateKey,
                    'sort_group' => 2,
                ]);
            }
        }

        foreach ($paymentHistory as $payment) {
            $amount = (float) ($payment['amount'] ?? 0);
            $dateRaw = (string) ($payment['date'] ?? '');
            $dateKey = null;
            if ($dateRaw !== '') {
                try {
                    $dateKey = Carbon::parse($dateRaw)->format('Y-m-d');
                } catch (\Throwable $e) {
                    $dateKey = null;
                }
            }
            $timeline->push([
                'date' => $dateRaw ?: '—',
                'description' => $payment['description'] ?? 'Payment',
                'type' => 'payment',
                'status' => 'Paid',
                'amount' => 0.0,
                'formatted_amount' => CurrencyHelper::formatCurrency(0),
                'paid_amount' => $amount,
                'formatted_paid_amount' => $payment['formatted_amount'] ?? CurrencyHelper::formatCurrency($amount),
                'date_key' => $dateKey,
                'sort_group' => 3,
            ]);
        }

        $timeline = $timeline
            ->sortBy([
                ['date_key', 'asc'],
                ['sort_group', 'asc'],
            ])
            ->values()
            ->map(function ($row) {
                unset($row['date_key'], $row['sort_group']);
                return $row;
            })
            ->all();

        $txnTotal = array_reduce($rows, fn ($sum, $r) => $sum + (float) ($r['amount'] ?? 0), 0.0);
        $paymentTotal = array_reduce($paymentHistory, fn ($sum, $r) => $sum + (float) ($r['amount'] ?? 0), 0.0);
        $netDue = max(0.0, round($txnTotal - $paymentTotal, 2));

        $userName = $card->user?->name ?? 'Cardholder';
        $dueDateLabel = '—';
        if ($card->due_day) {
            $periodEnd = $to->copy();
            $dueDate = $periodEnd->copy()->addMonth()->day(min((int) $card->due_day, $periodEnd->copy()->addMonth()->daysInMonth));
            $dueDateLabel = $dueDate->format('F j, Y');
        }

        return [
            'card' => $card,
            'userName' => $userName,
            'transactions' => $rows,
            'timeline' => $timeline,
            'paymentHistory' => $paymentHistory,
            'statementMonthLabel' => Carbon::createFromFormat('Y-m', $month)->format('F Y'),
            'periodStart' => $from->format('M j, Y'),
            'periodEnd' => $to->format('M j, Y'),
            'dueDateLabel' => $dueDateLabel,
            'txnTotal' => round($txnTotal, 2),
            'paymentTotal' => round($paymentTotal, 2),
            'netDue' => $netDue,
        ];
    }

    private function isSoaMonthAvailable(Card $card, string $month): bool
    {
        $statementDay = (int) ($card->statement_day ?? 1);
        $statementDay = max(1, min(31, $statementDay));
        [, $periodEnd] = StatementPeriodHelper::periodForYearMonth($month, $statementDay);
        return $periodEnd->endOfDay()->lte(now()->endOfDay());
    }
}

