<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class VerifyRegistrationController extends Controller
{
    /**
     * @param  int  $user  User id from route `{user}` (int type-hint avoids implicit User binding / premature 404).
     */
    public function show(int $user): RedirectResponse
    {
        // Signature is validated by `signed` middleware (invalid/expired → 403).
        $account = User::query()->find($user);

        if (! $account) {
            return redirect()->route('login')->with('flash', [
                'type' => 'error',
                'message' => 'This verification link is invalid or the account no longer exists.',
            ]);
        }

        if ($account->email_verified_at) {
            return redirect()->route('login')->with('flash', [
                'type' => 'info',
                'message' => 'Your email is already verified. You can sign in.',
            ]);
        }

        $account->update(['email_verified_at' => now()]);

        return redirect()->route('login')->with('flash', [
            'type' => 'success',
            'message' => 'Email verified. You can now sign in.',
        ]);
    }
}
