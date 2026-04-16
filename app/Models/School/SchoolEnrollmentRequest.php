<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\Child\FamilyProfile;
use App\Models\User;

/**
 * Veli Okul Kayıt Talebi
 *
 * Veliler uygulamadan okul kayıt kodu ile okulu arayıp
 * kayıt talebi gönderir. Okul yöneticisi bu talebi onaylar veya reddeder.
 */
class SchoolEnrollmentRequest extends BaseModel
{
    protected $table = 'school_enrollment_requests';

    protected $fillable = [
        'school_id',
        'user_id',
        'family_profile_id',
        'child_id',
        'parent_name',
        'parent_surname',
        'parent_email',
        'parent_phone',
        'invite_token',
        'status',
        'message',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class);
    }

    public function child()
    {
        return $this->belongsTo(Child::class)->withDefault();
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by')->withDefault();
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function approve(int $reviewerId): void
    {
        $this->update([
            'status' => 'approved',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);
    }

    public function reject(int $reviewerId, string $reason): void
    {
        $this->update([
            'status' => 'rejected',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }
}
