<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Assign the "Cards" feature to all existing users so the Cards link appears in the sidebar.
     */
    public function up(): void
    {
        $cardsFeatureId = DB::table('features')->where('name', 'cards')->value('id');
        if (! $cardsFeatureId) {
            return;
        }

        $userIds = DB::table('users')->pluck('id');
        foreach ($userIds as $userId) {
            $exists = DB::table('feature_user')
                ->where('user_id', $userId)
                ->where('feature_id', $cardsFeatureId)
                ->exists();
            if (! $exists) {
                DB::table('feature_user')->insert([
                    'user_id' => $userId,
                    'feature_id' => $cardsFeatureId,
                ]);
            }
        }
    }

    /**
     * Reverse: remove the Cards feature from all users.
     */
    public function down(): void
    {
        $cardsFeatureId = DB::table('features')->where('name', 'cards')->value('id');
        if ($cardsFeatureId) {
            DB::table('feature_user')->where('feature_id', $cardsFeatureId)->delete();
        }
    }
};
