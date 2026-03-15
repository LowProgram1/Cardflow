<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('part_time_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('part_time_id')->constrained('part_times')->cascadeOnDelete();
            $table->date('schedule')->index();
            $table->decimal('hours', 10, 2);
            $table->decimal('amount_paid', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_time_payments');
    }
};
