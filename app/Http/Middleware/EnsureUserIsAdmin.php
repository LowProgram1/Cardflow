<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403, 'Access denied. Admin only.');
        }
        // Treat null/missing role as admin so legacy or misconfigured admin users are not blocked
        if (($user->role ?? 'admin') !== 'admin') {
            abort(403, 'Access denied. Admin only.');
        }

        return $next($request);
    }
}
