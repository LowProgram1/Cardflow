<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $faviconPath = public_path('favicon.ico');
        $faviconUrl = file_exists($faviconPath) ? '/favicon.ico?v=' . filemtime($faviconPath) : null;

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role ?? 'admin',
                ] : null,
                'isAdmin' => $request->user() && (($request->user()->role ?? 'admin') === 'admin'),
                'idleTimeoutMinutes' => $request->user() ? (int) config('session.lifetime', 5) : null,
                'features' => $request->user() ? $request->user()->features()->get()->pluck('name')->all() : [],
            ],
            'flash' => function () use ($request) {
                $flash = $request->session()->get('flash');
                $message = is_array($flash) ? ($flash['message'] ?? null) : null;
                if ($message === null) {
                    return null;
                }
                return [
                    'message' => $message,
                    'type' => is_array($flash) ? ($flash['type'] ?? 'success') : 'success',
                    'key' => microtime(true),
                ];
            },
            'openModal' => fn () => $request->session()->get('openModal'),
            'csrf_token' => csrf_token(),
            'favicon_url' => $faviconUrl,
        ]);
    }
}
