<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Encrypt sensitive card columns for data privacy (e.g. Data Privacy Act).
     * Uses Laravel's encryption so the Card model encrypted cast can decrypt.
     */
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->dropIndex(['last_four']);
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->text('name')->change();
            $table->text('last_four')->nullable()->change();
            $table->text('bank_name')->nullable()->change();
        });

        DB::table('cards')->orderBy('id')->chunk(100, function ($rows) {
            foreach ($rows as $row) {
                $updates = [];
                if (isset($row->name) && $row->name !== '' && ! $this->looksEncrypted($row->name)) {
                    $updates['name'] = Crypt::encrypt($row->name);
                }
                if (isset($row->last_four) && $row->last_four !== '' && ! $this->looksEncrypted($row->last_four)) {
                    $updates['last_four'] = Crypt::encrypt($row->last_four);
                }
                if (isset($row->bank_name) && $row->bank_name !== '' && ! $this->looksEncrypted($row->bank_name)) {
                    $updates['bank_name'] = Crypt::encrypt($row->bank_name);
                }
                if ($updates !== []) {
                    DB::table('cards')->where('id', $row->id)->update($updates);
                }
            }
        });
    }

    private function looksEncrypted(?string $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }
        return str_starts_with($value, 'eyJpdiI6'); // Laravel encrypted payload typically starts with base64 json
    }

    /**
     * Reverse: decrypt and revert columns to string. Fails if APP_KEY changed.
     */
    public function down(): void
    {
        DB::table('cards')->orderBy('id')->chunk(100, function ($rows) {
            foreach ($rows as $row) {
                $updates = [];
                try {
                    if (isset($row->name) && $this->looksEncrypted($row->name)) {
                        $updates['name'] = Crypt::decrypt($row->name);
                    }
                } catch (\Throwable $e) {
                    // leave as is
                }
                try {
                    if (isset($row->last_four) && $this->looksEncrypted($row->last_four)) {
                        $updates['last_four'] = Crypt::decrypt($row->last_four);
                    }
                } catch (\Throwable $e) {
                    // leave as is
                }
                try {
                    if (isset($row->bank_name) && $this->looksEncrypted($row->bank_name)) {
                        $updates['bank_name'] = Crypt::decrypt($row->bank_name);
                    }
                } catch (\Throwable $e) {
                    // leave as is
                }
                if ($updates !== []) {
                    DB::table('cards')->where('id', $row->id)->update($updates);
                }
            }
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->string('name')->change();
            $table->string('last_four', 4)->nullable()->change();
            $table->string('bank_name')->nullable()->change();
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->index('last_four');
        });
    }
};
