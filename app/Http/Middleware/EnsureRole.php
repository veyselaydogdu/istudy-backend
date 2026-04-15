<?php

namespace App\Http\Middleware;

use App\Models\Base\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rol tabanlı erişim kontrolü.
 *
 * Kullanım: Route::middleware('role:tenant,super_admin')
 *
 * Kabul edilen argümanlar: role_id (int) veya role name (string)
 *   - 'role:super_admin,tenant'
 *   - 'role:1,5'
 *   - 'role:parent'
 *   - 'role:teacher'
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Kimlik doğrulama gereklidir.',
            ], 401);
        }

        $allowedIds = $this->resolveRoleIds($roles);

        if (! in_array($user->role_id, $allowedIds, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Bu alana erişim yetkiniz bulunmuyor.',
            ], 403);
        }

        return $next($request);
    }

    /**
     * Role isim veya ID listesini ID listesine çevirir.
     *
     * @param  string[]  $roles
     * @return int[]
     */
    private function resolveRoleIds(array $roles): array
    {
        $nameMap = [
            'super_admin' => UserRole::SUPER_ADMIN,
            'tenant' => UserRole::TENANT,
            'teacher' => UserRole::TEACHER,
            'parent' => UserRole::PARENT,
            'student' => UserRole::STUDENT,
        ];

        $ids = [];
        foreach ($roles as $role) {
            if (is_numeric($role)) {
                $ids[] = (int) $role;
            } elseif (isset($nameMap[$role])) {
                $ids[] = $nameMap[$role];
            }
        }

        return $ids;
    }
}
