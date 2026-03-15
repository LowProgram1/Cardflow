<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateHost
{
    /**
     * Reject requests whose Host header is not in the allowed list.
     * Prevents host header injection and cache poisoning.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $allowedHosts = config('security.allowed_hosts', []);

        if ($allowedHosts === [] || $allowedHosts === null) {
            return $next($request);
        }

        $host = $request->getHost();

        foreach ($allowedHosts as $allowed) {
            if (strcasecmp($host, $allowed) === 0) {
                return $next($request);
            }
        }

        abort(400, 'Invalid request.');
    }
}
