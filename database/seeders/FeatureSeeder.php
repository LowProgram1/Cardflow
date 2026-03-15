<?php

namespace Database\Seeders;

use App\Models\Feature;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $features = [
            ['name' => 'expense_tracker', 'display_name' => 'Expense Tracker'],
            ['name' => 'salary_monitoring', 'display_name' => 'Salary Monitoring'],
            ['name' => 'cards', 'display_name' => 'Cards'],
        ];

        foreach ($features as $feature) {
            Feature::firstOrCreate(
                ['name' => $feature['name']],
                ['display_name' => $feature['display_name']]
            );
        }
    }
}
