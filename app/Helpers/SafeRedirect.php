<?php

namespace App\Helpers;

use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Str;

class SafeRedirect
{
    /**
     * Return a redirect response to the intended URL only if it is same-origin or relative.
     * Otherwise redirect to the default URL (prevents open redirect attacks).
     */
    public static function intended(Redirector $redirector, string $default, Request $request): \Illuminate\Http\RedirectResponse
    {
        $intended = $request->session()->pull('url.intended');

        if (empty($intended)) {
            return $redirector->to($default);
        }

        if (self::isSafeRedirectUrl($intended, $request)) {
            return $redirector->to($intended);
        }

        return $redirector->to($default);
    }

    /**
     * Allow only relative paths or same-origin absolute URLs.
     */
    public static function isSafeRedirectUrl(?string $url, Request $request): bool
    {
        if ($url === null || $url === '') {
            return false;
        }

        if (Str::startsWith($url, '/') && ! Str::startsWith($url, '//')) {
            return true;
        }

        $host = $request->getHost();
        $parsed = parse_url($url);

        if (! isset($parsed['host'])) {
            return false;
        }

        return strtolower($parsed['host']) === strtolower($host);
    }
}
