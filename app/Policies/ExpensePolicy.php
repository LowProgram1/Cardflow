<?php

namespace App\Policies;

use App\Models\Card;
use App\Models\User;

class ExpensePolicy
{
    /**
     * Admin may only link expenses to admin-owned/system cards.
     * Non-admin may only use their own cards and own user_id.
     */
    public function assignCardForExpense(User $actor, int $targetUserId, int $cardId): bool
    {
        $card = Card::query()->with('user:id,role')->find($cardId);
        if (! $card) {
            return false;
        }

        $isAdmin = ($actor->role ?? 'admin') === 'admin';
        if (! $isAdmin) {
            return $targetUserId === (int) $actor->id && (int) $card->user_id === (int) $actor->id;
        }

        // Admin must not use client-owned cards for admin-created expenses.
        $cardOwnerRole = $card->user?->role ?? 'admin';

        return $cardOwnerRole === 'admin';
    }
}

