<?php

namespace App\Models\School;

use App\Models\Tenant\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherCredentialTenantApproval extends Model
{
    protected $table = 'teacher_credential_tenant_approvals';

    protected $fillable = [
        'credential_type',
        'credential_id',
        'tenant_id',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public static function forCredential(string $type, int $id, int $tenantId): ?self
    {
        return static::where('credential_type', $type)
            ->where('credential_id', $id)
            ->where('tenant_id', $tenantId)
            ->first();
    }
}
