<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tenant Paneli Erişim Kontrolü
 *
 * Yalnızca super_admin (1) ve tenant (5) rollerine sahip kullanıcıların
 * tenant paneli endpoint'lerine erişmesini sağlar.
 * Teacher ve parent rolündeki kullanıcılar 403 alır.
 */
class EnsureTenantRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Kimlik doğrulama gereklidir.',
            ], 401);
        }

        if (! $user->canAccessTenantPanel()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu alana erişim yetkiniz bulunmuyor.',
            ], 403);
        }

        return $next($request);
    }
}
