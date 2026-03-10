<?php

namespace App\Services;

use App\Models\Card;
use App\Repositories\Contracts\CardRepositoryInterface;
use App\Services\Contracts\CardServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CardService implements CardServiceInterface
{
    public function __construct(
        private readonly CardRepositoryInterface $cards,
    ) {
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->cards->paginate($perPage);
    }

    public function allActive(): Collection
    {
        return $this->cards->allActive();
    }

    public function create(array $attributes): Card
    {
        return DB::transaction(fn () => $this->cards->create($attributes));
    }

    public function update(Card $card, array $attributes): Card
    {
        return DB::transaction(fn () => $this->cards->update($card, $attributes));
    }

    public function delete(Card $card): void
    {
        DB::transaction(fn () => $this->cards->delete($card));
    }
}

