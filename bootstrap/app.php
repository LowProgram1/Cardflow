<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\ValidateHost::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'is.admin' => \App\Http\Middleware\IsAdmin::class,
            'feature' => \App\Http\Middleware\CheckFeature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // 303 See Other: follow-up must use GET. Fixes Inertia/XHR retrying PUT/PATCH against /login after a 302 (MethodNotAllowed on login).
        $exceptions->renderable(function (Throwable $e, Request $request) {
            if ($e instanceof AuthenticationException) {
                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Unauthenticated.'], 401);
                }

                return redirect()->guest(route('login'), 303);
            }
            if ($e instanceof TokenMismatchException) {
                return redirect()->route('login', [], 303);
            }
            if ($e instanceof HttpException && $e->getStatusCode() === 419) {
                return redirect()->route('login', [], 303);
            }

            return null;
        });
    })->create();
