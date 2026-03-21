<?php

namespace App\Http\Controllers\Auth;

use App\Helpers\SafeRedirect;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class LoginController extends Controller
{
    public function show(): InertiaResponse|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);
        $email = strtolower((string) ($credentials['email'] ?? ''));
        $attemptKey = 'login-failed:' . $email . '|' . $request->ip();
        $maxFailedAttempts = 4;

        if (RateLimiter::tooManyAttempts($attemptKey, $maxFailedAttempts)) {
            return redirect()
                ->route('password.request', ['email' => $email])
                ->withErrors([
                    'email' => 'Too many incorrect password attempts. Please reset your password.',
                ]);
        }

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            if ($user->email_verified_at === null) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return back()->withErrors([
                    'email' => 'Please verify your email before signing in. Check your inbox (and spam) for the activation link.',
                ])->onlyInput('email');
            }

            $request->session()->regenerate();
            RateLimiter::clear($attemptKey);

            return SafeRedirect::intended(redirect(), route('dashboard'), $request);
        }

        RateLimiter::hit($attemptKey, 3600);

        if (RateLimiter::tooManyAttempts($attemptKey, $maxFailedAttempts)) {
            return redirect()
                ->route('password.request', ['email' => $email])
                ->withErrors([
                    'email' => 'Too many incorrect password attempts. Please reset your password.',
                ]);
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }
}
