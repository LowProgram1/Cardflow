<?php

namespace App\Services\Contracts;

use App\Models\Card;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface CardServiceInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function allActive(): Collection;

    public function create(array $attributes): Card;

    public function update(Card $card, array $attributes): Card;

    public function delete(Card $card): void;
}

