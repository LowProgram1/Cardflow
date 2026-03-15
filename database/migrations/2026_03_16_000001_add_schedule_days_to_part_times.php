<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('part_times', function (Blueprint $table) {
            $table->json('schedule_days')->nullable()->after('student_name')->comment('Selected weekdays: mon, tue, wed, thu, fri');
        });
        Schema::table('part_times', function (Blueprint $table) {
            $table->date('schedule')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('part_times', function (Blueprint $table) {
            $table->dropColumn('schedule_days');
        });
        Schema::table('part_times', function (Blueprint $table) {
            $table->date('schedule')->nullable(false)->change();
        });
    }
};
