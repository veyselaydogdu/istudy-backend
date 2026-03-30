<?php

namespace App\Models\Activity;

use App\Models\Billing\Invoice;
use App\Models\Child\Child;
use App\Models\Child\FamilyProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Veli etkinlik katılım kaydı — çocuk bazlıdır.
 * Plain Model — FamilyProfile tenant_id=NULL olduğu için BaseModel scope kırar.
 */
class ActivityEnrollment extends Model
{
    protected $table = 'activity_enrollments';

    protected $fillable = [
        'activity_id',
        'family_profile_id',
        'child_id',
        'enrolled_by_user_id',
        'enrolled_at',
        'note',
        'invoice_id',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
        ];
    }

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    public function familyProfile()
    {
        return $this->belongsTo(FamilyProfile::class);
    }

    public function child()
    {
        return $this->belongsTo(Child::class)->withoutGlobalScope('tenant');
    }

    public function enrolledBy()
    {
        return $this->belongsTo(User::class, 'enrolled_by_user_id')->withDefault();
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class)->withoutGlobalScope('tenant');
    }
}
