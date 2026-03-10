<?php

namespace App\Http\Controllers;

use App\Helpers\CurrencyHelper;
use App\Http\Requests\Card\CardStoreRequest;
use App\Http\Requests\Card\CardUpdateRequest;
use App\Models\Card;
use App\Models\CardType;
use App\Services\Contracts\CardServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Response as InertiaResponse;

class CardController extends Controller
{
    public function __construct(
        private readonly CardServiceInterface $cards,
    ) {
    }

    public function index(): InertiaResponse
    {
        $result = $this->cards->paginate(10);

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
        $data['user_id'] = auth()->id() ?? 1;

        $this->cards->create($data);

        return redirect()->route('cards.index')->with('flash', [
            'type' => 'success',
            'message' => 'Card created successfully.',
        ]);
    }

    public function update(CardUpdateRequest $request, Card $card): RedirectResponse
    {
        $data = $request->validated();
        $this->cards->update($card, $data);

        return redirect()->route('cards.index')->with('flash', [
            'type' => 'success',
            'message' => 'Card updated successfully.',
        ]);
    }

    public function destroy(Card $card): RedirectResponse
    {
        $this->cards->delete($card);

        return redirect()->route('cards.index')->with('flash', [
            'type' => 'delete',
            'message' => 'Card removed.',
        ]);
    }
}

