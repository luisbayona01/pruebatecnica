<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\ForceJson::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (Throwable $e, $request) {
            if (
                $request->is('api/*')
                && ($e instanceof \Illuminate\Auth\AuthenticationException
                    || $e instanceof \PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException
                    || $e instanceof \PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException
                    || $e instanceof \PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException)
            ) {
                return response()->json(['message' => 'No autenticado. Token faltante o inválido.'], 401);
            }

            if (config('app.debug')) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'exception' => get_class($e),
                    'file' => $e->getFile() . ':' . $e->getLine(),
                ], 500);
            }

            return null;
        });
    })->create();
