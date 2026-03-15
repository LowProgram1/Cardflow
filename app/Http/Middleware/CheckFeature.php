<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeature
{
    /**
     * Ensure the authenticated user has the given feature (F-ACS).
     *
     * @param  array<string>  $features  Feature name(s) from route (e.g. middleware('feature:salary_monitoring'))
     */
    public function handle(Request $request, Closure $next, string ...$features): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403, 'Unauthenticated.');
        }

        foreach ($features as $featureName) {
            if ($user->hasFeature($featureName)) {
                return $next($request);
            }
        }

        abort(403, 'You do not have access to this feature.');
    }
}
