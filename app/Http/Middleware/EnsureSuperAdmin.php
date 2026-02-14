<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Super Admin Middleware
 *
 * Bu middleware sadece super_admin rolüne sahip kullanıcıların
 * admin paneli endpoint'lerine erişmesini sağlar.
 */
class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Kimlik doğrulama gereklidir.',
            ], 401);
        }

        if (! $user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Bu işlem için Super Admin yetkisi gereklidir.',
            ], 403);
        }

        return $next($request);
    }
}
