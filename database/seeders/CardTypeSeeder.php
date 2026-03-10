<?php

namespace Database\Seeders;

use App\Models\CardType;
use Illuminate\Database\Seeder;

class CardTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['VISA', 'Mastercard'];

        foreach ($types as $name) {
            CardType::query()->firstOrCreate(['name' => $name]);
        }
    }
}
