<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('expense_type_id')->nullable()->after('card_id')->constrained('expense_types')->nullOnDelete();
            $table->string('payment_type', 20)->default('full')->after('type')->comment('full or installment');
            $table->foreignId('payment_term_id')->nullable()->after('payment_type')->constrained('payment_terms')->nullOnDelete();
            $table->decimal('monthly_amortization', 12, 2)->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['expense_type_id']);
            $table->dropForeign(['payment_term_id']);
            $table->dropColumn(['expense_type_id', 'payment_type', 'payment_term_id', 'monthly_amortization']);
        });
    }
};
