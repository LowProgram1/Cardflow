<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('class_name');
            $table->unsignedInteger('duration')->default(0)->comment('Duration in minutes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_classes');
    }
};
