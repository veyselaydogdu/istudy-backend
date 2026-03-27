<?php

namespace App\Models\Child;

use App\Models\School\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Velinin bir çocuğu için okul yönetimine gönderdiği silme/okul çıkarma talebi.
 * Plain Model (BaseModel değil) — parent kullanıcılar tenant_id=NULL.
 */
class ChildRemovalRequest extends Model
{
    use SoftDeletes;

    protected $table = 'child_removal_requests';

    protected $fillable = [
        'child_id',
        'family_profile_id',
        'school_id',
        'tenant_id',
        'requested_by_user_id',
        'status',
        'reason',
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

    public function school(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(School::class);
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
}
