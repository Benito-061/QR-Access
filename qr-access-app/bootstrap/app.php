<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::get('/ping', function () {
                $root = base_path();
                $lines = [
                    'pong',
                    'PHP: '.PHP_VERSION,
                    'base_path: '.$root,
                    'storage writable: '.(is_writable(storage_path()) ? 'oui' : 'NON'),
                    'session driver: '.config('session.driver'),
                ];
                try {
                    \Illuminate\Support\Facades\DB::connection()->getPdo();
                    $lines[] = 'DB: ok';
                } catch (Throwable $e) {
                    $lines[] = 'DB: '.$e->getMessage();
                }

                return response(implode("\n", $lines), 200, [
                    'Content-Type' => 'text/plain; charset=utf-8',
                ]);
            })->withoutMiddleware([
                \Illuminate\Session\Middleware\StartSession::class,
                \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            ]);

            Route::get('/server-check', function () {
                $lines = [
                    '=== QR Access — Diagnostic ===',
                    'Date: '.now()->toIso8601String(),
                    'PHP: '.PHP_VERSION,
                    'base_path: '.base_path(),
                    'storage writable: '.(is_writable(storage_path()) ? 'oui' : 'NON'),
                    'SESSION_DRIVER: '.config('session.driver'),
                    'APP_URL: '.config('app.url'),
                ];
                try {
                    \Illuminate\Support\Facades\DB::connection()->getPdo();
                    $lines[] = 'DB: connecté';
                } catch (Throwable $e) {
                    $lines[] = 'DB ERREUR: '.$e->getMessage();
                }

                return response(implode("\n", $lines), 200, [
                    'Content-Type' => 'text/plain; charset=utf-8',
                ]);
            });
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'invitee' => \App\Http\Middleware\EnsureInviteeGuest::class,
            'invitee.guest' => \App\Http\Middleware\RedirectIfInviteeGuest::class,
            'invitee.block_admin' => \App\Http\Middleware\RedirectInviteeFromAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
