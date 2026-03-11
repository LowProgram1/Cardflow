<?php

namespace App\Http\Controllers;

use App\Helpers\CurrencyHelper;
use App\Helpers\StatementPeriodHelper;
use App\Http\Requests\Card\CardStoreRequest;
use App\Http\Requests\Card\CardUpdateRequest;
use App\Models\Card;
use App\Models\CardType;
use App\Services\Contracts\CardServiceInterface;
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
        $isAdmin = ($user->role ?? 'admin') === 'admin';
        $userId = $isAdmin ? null : $user->id;

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
            'cardTypes' => $isAdmin ? CardType::query()->orderBy('name')->get(['id', 'name']) : [],
            'viewOnly' => ! $isAdmin,
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
        if ((auth()->user()->role ?? 'admin') !== 'admin') {
            abort(403, 'Only admins can create cards.');
        }
        $data = $request->validated();
        $data['user_id'] = auth()->id() ?? 1;

        $this->cards->create($data);

        return redirect()->route('cards.index')->with('flash', [
            'type' => 'success',
            'message' => 'Card created successfully.',
        ]);
    }

    public function update(CardUpdateRequest $request, Card $card): RedirectResponse
    {
        $user = auth()->user();
        if (($user->role ?? 'admin') !== 'admin') {
            abort(403, 'Only admins can edit cards.');
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
        if ((auth()->user()->role ?? 'admin') !== 'admin') {
            abort(403, 'Only admins can delete cards.');
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
        $user = auth()->user();
        if (($user->role ?? 'admin') !== 'admin' && $card->user_id != $user->id) {
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
            return [
                'id' => $expense->id,
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
        $user = auth()->user();
        if (($user->role ?? 'admin') !== 'admin' && $card->user_id != $user->id) {
            abort(403, 'You can only view statement months for your own cards.');
        }
        $months = $this->cards->getStatementMonthsForCard($card);

        return response()->json(['statement_months' => $months]);
    }

    /**
     * Statement of Account: HTML view for the given month (statement period). User can print/save as PDF.
     */
    public function statement(Request $request, Card $card)
    {
        $user = auth()->user();
        if (($user->role ?? 'admin') !== 'admin' && $card->user_id != $user->id) {
            abort(403, 'You can only view statements for your own cards.');
        }
        $card->load('user');
        $month = $request->input('month', now()->format('Y-m'));
        $statementDay = (int) ($card->statement_day ?? 1);
        $statementDay = max(1, min(31, $statementDay));

        [$from, $to] = StatementPeriodHelper::periodForYearMonth($month, $statementDay);
        $transactions = $this->cards->getTransactionsForCard($card, $from, $to);

        $userName = $card->user?->name ?? 'Cardholder';
        $dueDay = $card->due_day;
        $dueDateLabel = '—';
        if ($dueDay) {
            $periodEnd = $to->copy();
            $dueDate = $periodEnd->copy()->addMonth()->day(min($dueDay, $periodEnd->copy()->addMonth()->daysInMonth));
            $dueDateLabel = $dueDate->format('F j, Y');
        }

        $rows = $transactions->map(function ($expense) {
            return [
                'date' => $expense->transaction_date?->format('M j, Y'),
                'description' => $expense->description ?? $expense->expenseType?->name ?? '—',
                'type' => $expense->type,
                'amount' => (float) $expense->amount,
                'formatted_amount' => CurrencyHelper::formatCurrency((float) $expense->amount),
            ];
        });

        return view('cards.statement', [
            'card' => $card,
            'userName' => $userName,
            'transactions' => $rows,
            'periodStart' => $from->format('M j, Y'),
            'periodEnd' => $to->format('M j, Y'),
            'dueDateLabel' => $dueDateLabel,
            'statementMonth' => $month,
        ]);
    }
}

