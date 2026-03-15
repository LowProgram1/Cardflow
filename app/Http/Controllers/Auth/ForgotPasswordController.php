<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ForgotPasswordController extends Controller
{
    public function show(): InertiaResponse
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('flash', [
                'type' => 'success',
                'message' => 'If that email is registered, you will receive a password reset link shortly.',
            ]);
        }

        if ($status === Password::RESET_THROTTLED) {
            return back()->withErrors(['email' => 'Too many requests. Please try again later.']);
        }

        // For invalid users, still show success for security (don't reveal if email exists).
        return back()->with('flash', [
            'type' => 'success',
            'message' => 'If that email is registered, you will receive a password reset link shortly.',
        ]);
    }
}
