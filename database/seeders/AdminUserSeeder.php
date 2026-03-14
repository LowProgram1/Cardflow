<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Create or update the admin user using credentials from environment.
     * Run: php artisan db:seed --class=AdminUserSeeder
     */
    public function run(): void
    {
        $email = config('app.env') === 'production'
            ? (env('ADMIN_EMAIL') ?: 'admin@yourdomain.com')
            : (env('ADMIN_EMAIL') ?: 'admin@yourdomain.com');

        $password = env('ADMIN_PASSWORD');
        if (empty($password)) {
            $this->command->error('ADMIN_PASSWORD is not set in .env. Set a secure password before running this seeder.');

            return;
        }

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'password' => $password,
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("Admin user created/updated for: {$email}");
    }
}
