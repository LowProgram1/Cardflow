<?php

namespace App\Repositories\Contracts;

use App\Models\Card;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface CardRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function allActive(): Collection;

    public function create(array $attributes): Card;

    public function update(Card $card, array $attributes): Card;

    public function delete(Card $card): void;

    public function countActive(): int;
}

