<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_rates', function (Blueprint $table) {
            $table->date('rate_date')->default('2000-01-01')->after('user_id');
        });

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::table('salary_rates')->update(['rate_date' => DB::raw("CONCAT(year, '-01-01')")]);
        } else {
            foreach (DB::table('salary_rates')->get() as $row) {
                DB::table('salary_rates')->where('id', $row->id)->update([
                    'rate_date' => $row->year . '-01-01',
                ]);
            }
        }

        Schema::table('salary_rates', function (Blueprint $table) {
            $table->dropColumn('year');
        });
    }

    public function down(): void
    {
        Schema::table('salary_rates', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->default(2000)->after('user_id');
        });

        foreach (DB::table('salary_rates')->get() as $row) {
            DB::table('salary_rates')->where('id', $row->id)->update([
                'year' => (int) date('Y', strtotime($row->rate_date)),
            ]);
        }

        Schema::table('salary_rates', function (Blueprint $table) {
            $table->dropColumn('rate_date');
        });
    }
};
