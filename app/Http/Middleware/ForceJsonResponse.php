<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * API isteklerinde Accept: application/json header'ını zorla.
 *
 * Bu middleware olmadan:
 * - Accept header gönderilmeyen POST istekleri 302 redirect dönebilir
 * - GET istekleri HTML hata sayfası dönebilir
 *
 * Bu middleware ile tüm /api/* rotaları her zaman JSON döner.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
