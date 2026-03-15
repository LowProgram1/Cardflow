<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('part_times', function (Blueprint $table) {
            $table->id();
            $table->string('student_name');
            $table->date('schedule')->index();
            $table->decimal('rate_per_hr', 12, 2);
            $table->decimal('duration_hr', 10, 2);
            $table->decimal('amount_to_be_paid', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_times');
    }
};
