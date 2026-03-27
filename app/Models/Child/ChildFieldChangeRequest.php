<?php

namespace App\Models\Child;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Velinin çocuğa ait belirli bir alanı güncelleme talebi.
 * Okula kayıtlı çocuklarda doğum tarihi gibi kritik alanlar
 * tenant onayı gerektirir.
 * Plain Model — parent kullanıcılar tenant_id=NULL.
 */
class ChildFieldChangeRequest extends Model
{
    use SoftDeletes;

    protected $table = 'child_field_change_requests';

    protected $fillable = [
        'child_id',
        'family_profile_id',
        'school_id',
        'tenant_id',
        'requested_by_user_id',
        'field_name',
        'old_value',
        'new_value',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    // ── Relations ────────────────────────────────────────────────────────────

    public function child(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Child::class)->withoutGlobalScope('tenant');
    }

    public function familyProfile(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(FamilyProfile::class)->withoutGlobalScope('tenant');
    }

    public function requestedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function reviewer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /** Alan adının Türkçe karşılığı */
    public function fieldLabel(): string
    {
        return match ($this->field_name) {
            'birth_date' => 'Doğum Tarihi',
            default => $this->field_name,
        };
    }
}
