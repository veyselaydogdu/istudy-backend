<?php

namespace App\Http\Middleware;

use App\Models\Child\FamilyMember;
use App\Models\Child\FamilyProfile;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Co-parent izin kontrolü.
 *
 * Kullanım: family.permission:can_add_child
 *
 * super_parent her zaman geçer.
 * Co-parent için family_members.permissions JSON listesinde ilgili izin olmalı.
 */
class EnsureFamilyPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isParent()) {
            return response()->json(['success' => false, 'message' => 'Yetkisiz erişim.', 'data' => null], 403);
        }

        // super_parent tüm ailelerde tüm izinlere sahip
        $ownedFamily = FamilyProfile::withoutGlobalScope('tenant')
            ->where('owner_user_id', $user->id)
            ->exists();

        if ($ownedFamily) {
            return $next($request);
        }

        // co_parent — aktif kabul edilmiş üyeliği olan ailelerde izin kontrolü
        $member = FamilyMember::withoutGlobalScope('tenant')
            ->where('user_id', $user->id)
            ->where('invitation_status', 'accepted')
            ->where('is_active', true)
            ->first();

        if (! $member) {
            return response()->json(['success' => false, 'message' => 'Aile üyeliği bulunamadı.', 'data' => null], 403);
        }

        if (! $member->hasPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'Bu işlem için yetkiniz yok.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
