<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    /**
     * Ensure the user is an admin. If not, redirect to home (dashboard).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }
        if (($user->role ?? 'admin') !== 'admin') {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
