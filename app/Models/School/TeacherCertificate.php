<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;
use App\Models\User;

/**
 * TeacherCertificate — Öğretmen Sertifikaları
 *
 * Okul onayı gerektirir (approval_status).
 * Öğretmen ekler → pending → Okul admin onaylar/reddeder → approved/rejected
 */
class TeacherCertificate extends BaseModel
{
    protected $table = 'teacher_certificates';

    protected $fillable = [
        'teacher_profile_id',
        'name',
        'issuing_organization',
        'issue_date',
        'expiry_date',
        'credential_id',
        'credential_url',
        'file_path',
        'description',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date'  => 'date',
        'expiry_date' => 'date',
        'approved_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function teacherProfile()
    {
        return $this->belongsTo(TeacherProfile::class, 'teacher_profile_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePending($query)
    {
        return $query->where('approval_status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('approval_status', 'rejected');
    }

    public function scopeForProfile($query, int $profileId)
    {
        return $query->where('teacher_profile_id', $profileId);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers — Onay İşlemleri
    |--------------------------------------------------------------------------
    */

    /**
     * Sertifikayı onayla
     */
    public function approve(int $userId): self
    {
        $this->update([
            'approval_status' => 'approved',
            'approved_by'     => $userId,
            'approved_at'     => now(),
            'rejection_reason' => null,
        ]);

        return $this;
    }

    /**
     * Sertifikayı reddet
     */
    public function reject(int $userId, string $reason): self
    {
        $this->update([
            'approval_status'  => 'rejected',
            'approved_by'      => $userId,
            'approved_at'      => now(),
            'rejection_reason' => $reason,
        ]);

        return $this;
    }

    /**
     * Onay bekliyor mu?
     */
    public function isPending(): bool
    {
        return $this->approval_status === 'pending';
    }

    /**
     * Onaylı mı?
     */
    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    /**
     * Süresi geçmiş mi?
     */
    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    /**
     * Durum etiketi
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->approval_status) {
            'pending'  => 'Onay Bekliyor',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
            default    => $this->approval_status,
        };
    }
}
