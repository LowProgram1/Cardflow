<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserFeatureController extends Controller
{
    /**
     * Get a user's assigned feature IDs (and all features for UI).
     * Non-admin can only request their own user.
     */
    public function show(User $user)
    {
        $this->authorizeView($user);

        $userFeatureIds = $user->features()->get()->pluck('id')->all();
        $features = Feature::orderBy('display_name')->get(['id', 'name', 'display_name']);

        return response()->json([
            'features' => $features,
            'user_feature_ids' => $userFeatureIds,
        ]);
    }

    /**
     * Update the features assigned to a user (sync by feature IDs).
     * Admin can update any user; non-admin can only update self.
     */
    public function update(Request $request, User $user)
    {
        $this->authorizeUpdate($user);

        $request->validate([
            'feature_ids' => ['required', 'array'],
            'feature_ids.*' => ['integer', Rule::exists('features', 'id')],
        ]);

        $user->features()->sync($request->input('feature_ids', []));

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'message' => 'Features updated.',
                'feature_ids' => $user->fresh()->features()->get()->pluck('id')->all(),
            ]);
        }

        return back()->with('flash', ['type' => 'success', 'message' => 'Features updated.']);
    }

    private function authorizeView(User $user): void
    {
        $current = request()->user();
        if (! $current) {
            abort(403, 'Unauthenticated.');
        }
        if ($current->id !== $user->id && ($current->role ?? 'admin') !== 'admin') {
            abort(403, 'You can only view your own features.');
        }
    }

    private function authorizeUpdate(User $user): void
    {
        $current = request()->user();
        if (! $current) {
            abort(403, 'Unauthenticated.');
        }
        if ($current->id !== $user->id && ($current->role ?? 'admin') !== 'admin') {
            abort(403, 'You can only update your own features.');
        }
    }
}
