<?php

namespace App\Services;

use App\Models\School\SchoolRole;
use App\Models\School\SchoolUserRole;

/**
 * Okul Rol Servisi
 *
 * Okul ve sınıf bazlı özel rollerin oluşturulması, yetkilendirmesi ve atanması.
 */
class SchoolRoleService extends BaseService
{
    protected function model(): string
    {
        return SchoolRole::class;
    }

    /**
     * Rol oluştur ve izinleri ata
     */
    public function createWithPermissions(array $roleData, array $permissions = []): SchoolRole
    {
        $role = $this->create($roleData);

        foreach ($permissions as $permission) {
            $role->grantPermission($permission);
        }

        return $role->load('permissions');
    }

    /**
     * Rolü güncelle ve izinleri senkronize et
     */
    public function updateWithPermissions(SchoolRole $role, array $roleData, array $permissions = []): SchoolRole
    {
        $this->update($role, $roleData);

        if (! empty($permissions)) {
            // Mevcut izinleri sil ve yeniden oluştur
            $role->permissions()->delete();

            foreach ($permissions as $permission) {
                $role->grantPermission($permission);
            }
        }

        return $role->fresh('permissions');
    }

    /**
     * Kullanıcıya rol ata
     */
    public function assignRole(int $userId, int $roleId, int $schoolId, ?int $classId = null): SchoolUserRole
    {
        return SchoolUserRole::firstOrCreate([
            'user_id' => $userId,
            'school_role_id' => $roleId,
            'school_id' => $schoolId,
            'class_id' => $classId,
        ], [
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Kullanıcıdan rol kaldır
     */
    public function removeRole(int $userId, int $roleId, ?int $classId = null): void
    {
        SchoolUserRole::where('user_id', $userId)
            ->where('school_role_id', $roleId)
            ->when($classId, fn ($q) => $q->where('class_id', $classId))
            ->delete();
    }

    /**
     * Kullanıcının belirli bir izni var mı?
     */
    public function userHasPermission(int $userId, int $schoolId, string $permission, ?int $classId = null): bool
    {
        return SchoolUserRole::where('user_id', $userId)
            ->where('school_id', $schoolId)
            ->when($classId, fn ($q) => $q->where('class_id', $classId))
            ->whereHas('schoolRole.permissions', fn ($q) => $q->where('permission', $permission))
            ->exists();
    }

    /**
     * Filtreleme
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (isset($filters['class_id'])) {
            if ($filters['class_id'] === null) {
                $query->schoolLevel();
            } else {
                $query->where('class_id', $filters['class_id']);
            }
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }
    }
}
