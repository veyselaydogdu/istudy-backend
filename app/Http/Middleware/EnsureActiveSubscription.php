<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Aktif aboneliği olmayan tenant'ların kaynak oluşturmasını engeller.
 * (Okullar, sınıflar, öğrenciler vb.)
 */
class EnsureActiveSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Kimlik doğrulama gerekli.',
                'data' => null,
            ], 401);
        }

        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Tenant kontrolü
        $tenantId = $user->tenant_id;
        if (! $tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Bir kuruma bağlı değilsiniz.',
                'data' => null,
            ], 403);
        }

        $tenant = \App\Models\Tenant\Tenant::find($tenantId);
        if (! $tenant || ! $tenant->hasActiveSubscription()) {
            return response()->json([
                'success' => false,
                'message' => 'Aktif bir aboneliğiniz bulunmuyor. Lütfen bir paket seçin.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
