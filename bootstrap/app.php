<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Tüm /api/* rotalarında Accept: application/json zorla (JSON yanıtı garantiler)
        $middleware->prependToGroup('api', \App\Http\Middleware\ForceJsonResponse::class);

        // M-4: Güvenlik HTTP başlıkları tüm API yanıtlarına eklenir
        $middleware->appendToGroup('api', \App\Http\Middleware\SecurityHeaders::class);

        $middleware->alias([
            'subscription.active' => \App\Http\Middleware\EnsureActiveSubscription::class,
            'super.admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
            // L-2: Sanctum token ability kontrolü
            'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API isteklerinde stack trace içermeyen temiz JSON hataları döndür
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kimlik doğrulaması gerekiyor.',
                    'data' => null,
                ], 401);
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Doğrulama hatası.',
                    'errors' => $e->errors(),
                    'data' => null,
                ], 422);
            }

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kayıt bulunamadı.',
                    'data' => null,
                ], 404);
            }

            // HTTP exception'ları için orijinal status code'u koru (429, 403 vs.)
            if ($e instanceof HttpException) {
                $status = $e->getStatusCode();
                $message = match ($status) {
                    403 => 'Bu işlem için yetkiniz bulunmuyor.',
                    429 => 'Çok fazla istek gönderildi. Lütfen bekleyin.',
                    503 => 'Servis geçici olarak kullanılamıyor.',
                    default => 'Bir hata oluştu.',
                };

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'data' => null,
                ], $status);
            }

            return response()->json([
                'success' => false,
                'message' => 'Bir hata oluştu.',
                'data' => null,
            ], 500);
        });
    })->create();
