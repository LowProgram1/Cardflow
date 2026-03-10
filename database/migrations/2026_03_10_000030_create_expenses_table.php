<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->enum('type', ['expense', 'payment'])->default('expense')->index();
            $table->date('transaction_date')->index();
            $table->string('category')->nullable()->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['card_id', 'transaction_date']);
            $table->index(['user_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};

