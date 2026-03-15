<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_payments', function (Blueprint $table) {
            $table->date('schedule')->nullable()->after('salary_rate_id');
            $table->time('time_start')->nullable()->after('schedule');
            $table->time('time_end')->nullable()->after('time_start');
            $table->unsignedInteger('minutes')->nullable()->after('time_end');
            $table->decimal('extra_amount', 12, 2)->default(0)->after('minutes');
            $table->boolean('use_urgent_rate')->default(false)->after('extra_amount');
        });
    }

    public function down(): void
    {
        Schema::table('salary_payments', function (Blueprint $table) {
            $table->dropColumn(['schedule', 'time_start', 'time_end', 'minutes', 'extra_amount', 'use_urgent_rate']);
        });
    }
};
