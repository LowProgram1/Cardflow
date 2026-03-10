<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('user_id');
            $table->foreignId('card_type_id')->nullable()->after('bank_name')->constrained('card_types')->nullOnDelete();
            $table->unsignedTinyInteger('statement_day')->nullable()->after('due_day')->comment('Statement of account day (1-31)');
        });

        // Preserve existing closing_day values as statement_day
        DB::table('cards')->whereNotNull('closing_day')->update([
            'statement_day' => DB::raw('closing_day'),
        ]);

        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn('closing_day');
        });
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->unsignedTinyInteger('closing_day')->nullable()->after('limit');
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->dropForeign(['card_type_id']);
            $table->dropColumn(['bank_name', 'card_type_id', 'statement_day']);
        });
    }
};
