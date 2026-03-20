<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\VerifyRegistrationMail;
use App\Models\Feature;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Throwable;

class RegisterController extends Controller
{
    public function show(): InertiaResponse
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ], [
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'Password must be at least :min characters.',
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'email_verified_at' => null,
            'password' => Hash::make($validated['password']),
            'role' => 'user',
        ]);

        $user->features()->sync(Feature::defaultFeatureIds());

        try {
            // Queue verification email to avoid blocking the request on SMTP/network issues.
            Mail::to($user->email)->queue(new VerifyRegistrationMail($user));
        } catch (Throwable $e) {
            Log::warning('Failed to queue registration verification email.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()->route('login')->with('flash', [
            'type' => 'success',
            'message' => 'Email verification sent to ' . $validated['email'] . '. Activate it to login.',
        ]);
    }
}
