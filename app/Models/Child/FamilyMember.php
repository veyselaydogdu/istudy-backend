<?php

namespace App\Models\Child;

use App\Models\Base\BaseModel;
use App\Models\User;

class FamilyMember extends BaseModel
{
    protected $table = 'family_members';

    protected $fillable = [
        'family_profile_id',
        'user_id',
        'relation_type',
        'role',
        'is_active',
        'invited_by_user_id',
        'accepted_at',
        'invitation_status',
        'invitation_security_code',
        'permissions',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'accepted_at' => 'datetime',
            'permissions' => 'array',
        ];
    }

    /**
     * Verilen izne sahip mi kontrol eder.
     * super_parent için daima true döner.
     * null permissions → tüm izinler açık (geriye dönük uyumluluk).
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->role === 'super_parent') {
            return true;
        }

        if ($this->permissions === null) {
            return true;
        }

        return in_array($permission, $this->permissions, true);
    }

    /**
     * Geçerli izin sabitleri.
     */
    public static function availablePermissions(): array
    {
        return [
            'can_edit_child_profile',
            'can_add_child',
            'can_enroll_child',
            'can_view_child_details',
        ];
    }

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class, 'family_profile_id')->withDefault();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withDefault();
    }

    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by_user_id')->withDefault();
    }

    /**
     * Bu üyeye atanmış çocuklar (kısıtlı erişim listesi).
     * Boşsa üye tüm aile çocuklarına erişebilir.
     */
    public function restrictedChildren()
    {
        return $this->belongsToMany(Child::class, 'family_member_children', 'family_member_id', 'child_id')
            ->withTimestamps();
    }
}
