<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->json('paid_month_amounts')->nullable()->after('paid_months')->comment('For installment: month number => amount paid, e.g. {"1":"1000.00","2":"1200.00"}');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('paid_month_amounts');
        });
    }
};
