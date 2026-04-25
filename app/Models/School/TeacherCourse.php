<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;
use App\Models\User;

/**
 * TeacherCourse — Öğretmen Kurs & Seminer Katılımı
 *
 * Okul onayı gerektirir (approval_status).
 * Türler: course, seminar, workshop, conference, training, webinar, other
 */
class TeacherCourse extends BaseModel
{
    protected $table = 'teacher_courses';

    protected $fillable = [
        'teacher_profile_id',
        'title',
        'type',
        'provider',
        'start_date',
        'end_date',
        'duration_hours',
        'location',
        'is_online',
        'certificate_file',
        'file_path',
        'certificate_url',
        'description',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
        'is_online' => 'boolean',
        'duration_hours' => 'integer',
    ];

    /**
     * Kurs/Seminer türleri
     */
    public const TYPES = [
        'course' => 'Kurs',
        'seminar' => 'Seminer',
        'workshop' => 'Atölye',
        'conference' => 'Konferans',
        'training' => 'Eğitim',
        'webinar' => 'Webinar',
        'other' => 'Diğer',
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

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers — Onay İşlemleri
    |--------------------------------------------------------------------------
    */

    public function approve(int $userId): self
    {
        $this->update([
            'approval_status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        return $this;
    }

    public function reject(int $userId, string $reason): self
    {
        $this->update([
            'approval_status' => 'rejected',
            'approved_by' => $userId,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return $this;
    }

    public function isPending(): bool
    {
        return $this->approval_status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->approval_status) {
            'pending' => 'Onay Bekliyor',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
            default => $this->approval_status,
        };
    }
}
