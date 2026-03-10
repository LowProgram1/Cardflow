<?php

namespace Database\Seeders;

use App\Models\ExpenseType;
use Illuminate\Database\Seeder;

class ExpenseTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['Airlines', 'Hotel', 'Restaurant', 'Grocery'];

        foreach ($types as $name) {
            ExpenseType::query()->firstOrCreate(['name' => $name]);
        }
    }
}
