<?php

namespace App\Repositories\Eloquent;

use App\Models\Card;
use App\Repositories\Contracts\CardRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CardRepository implements CardRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Card::query()
            ->with(['cardType'])
            ->withCount('expenses')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function allActive(): Collection
    {
        return Card::query()
            ->with(['cardType'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function create(array $attributes): Card
    {
        return Card::query()->create($attributes);
    }

    public function update(Card $card, array $attributes): Card
    {
        $card->fill($attributes);
        $card->save();

        return $card;
    }

    public function delete(Card $card): void
    {
        $card->delete();
    }

    public function countActive(): int
    {
        return Card::query()->where('is_active', true)->count();
    }
}

