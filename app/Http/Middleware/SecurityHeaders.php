<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent clickjacking: only allow same-origin framing
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        // Prevent MIME sniffing (e.g. treat JSON as script)
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        // Legacy XSS filter (CSP is primary; this helps older browsers)
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        // Limit referrer leakage
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        // Disable sensitive browser features (geolocation, mic, camera, etc.)
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
        // Isolate app from cross-origin windows (mitigates cross-window attacks)
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        $connectSrc = "'self'";
        if (config('app.env') !== 'production' && config('app.debug')) {
            $connectSrc .= " ws://{$request->getHost()} wss://{$request->getHost()} ws://localhost wss://localhost";
        }
        $cspParts = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src {$connectSrc}",
            "frame-src 'none'",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ];
        if (config('app.env') === 'production' && $request->secure()) {
            $cspParts[] = 'upgrade-insecure-requests';
        }
        $response->headers->set('Content-Security-Policy', implode('; ', $cspParts));

        // HSTS: force HTTPS for 1 year; only when already on HTTPS to avoid breaking HTTP
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
