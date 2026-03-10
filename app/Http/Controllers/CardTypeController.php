<?php

namespace App\Http\Controllers;

use App\Models\CardType;
use App\Http\Requests\CardType\CardTypeStoreRequest;
use App\Http\Requests\CardType\CardTypeUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Response as InertiaResponse;

class CardTypeController extends Controller
{
    public function index(): InertiaResponse
    {
        $cardTypes = CardType::query()
            ->orderBy('name')
            ->get()
            ->map(fn (CardType $ct) => [
                'id' => $ct->id,
                'name' => $ct->name,
            ]);

        return $this->inertia('CardTypes/Index', [
            'cardTypes' => $cardTypes,
        ]);
    }

    public function store(CardTypeStoreRequest $request): RedirectResponse
    {
        CardType::query()->create($request->validated());

        return redirect()->route('settings.index', ['section' => 'card-types'])->with('flash', [
            'type' => 'success',
            'message' => 'Card type created successfully.',
        ]);
    }

    public function update(CardTypeUpdateRequest $request, CardType $card_type): RedirectResponse
    {
        $card_type->update($request->validated());

        return redirect()->route('settings.index', ['section' => 'card-types'])->with('flash', [
            'type' => 'success',
            'message' => 'Card type updated successfully.',
        ]);
    }

    public function destroy(CardType $card_type): RedirectResponse
    {
        $card_type->delete();

        return redirect()->route('settings.index', ['section' => 'card-types'])->with('flash', [
            'type' => 'delete',
            'message' => 'Card type removed.',
        ]);
    }
}
