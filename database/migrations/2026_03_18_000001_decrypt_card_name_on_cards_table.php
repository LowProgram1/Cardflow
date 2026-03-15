<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Decrypt card name so it is stored and displayed as plain text (not encrypted).
     */
    public function up(): void
    {
        DB::table('cards')->orderBy('id')->chunk(100, function ($rows) {
            foreach ($rows as $row) {
                if (empty($row->name) || ! $this->looksEncrypted($row->name)) {
                    continue;
                }
                try {
                    $decrypted = Crypt::decrypt($row->name);
                    DB::table('cards')->where('id', $row->id)->update(['name' => $decrypted]);
                } catch (\Throwable $e) {
                    // Skip if decryption fails (e.g. APP_KEY changed)
                }
            }
        });
    }

    public function down(): void
    {
        // Optionally re-encrypt names; skip for simplicity so rollback doesn't break if APP_KEY changed
    }

    private function looksEncrypted(?string $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        return str_starts_with($value, 'eyJpdiI6');
    }
};
