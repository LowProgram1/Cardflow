<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyRegistrationController extends Controller
{
    public function show(Request $request, User $user): RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            return redirect()->route('login')->with('flash', [
                'type' => 'error',
                'message' => 'This verification link is invalid or has expired.',
            ]);
        }

        if ($user->email_verified_at) {
            return redirect()->route('login')->with('flash', [
                'type' => 'info',
                'message' => 'Your email is already verified. You can sign in.',
            ]);
        }

        $user->update(['email_verified_at' => now()]);

        return redirect()->route('login')->with('flash', [
            'type' => 'success',
            'message' => 'Email verified. You can now sign in.',
        ]);
    }
}
