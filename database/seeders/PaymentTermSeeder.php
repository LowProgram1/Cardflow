<?php

namespace Database\Seeders;

use App\Models\PaymentTerm;
use Illuminate\Database\Seeder;

class PaymentTermSeeder extends Seeder
{
    public function run(): void
    {
        $months = [3, 6, 9, 12];

        foreach ($months as $m) {
            PaymentTerm::query()->firstOrCreate(['months' => $m]);
        }
    }
}
