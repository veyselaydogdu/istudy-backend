<?php

namespace App\Models\Child;

use App\Models\Health\Medication;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChildMedicationLog extends Model
{
    protected $table = 'child_medication_logs';

    protected $fillable = [
        'child_id',
        'medication_id',
        'custom_medication_name',
        'dose',
        'given_by_user_id',
        'given_at',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'given_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class);
    }

    public function medication(): BelongsTo
    {
        return $this->belongsTo(Medication::class);
    }

    public function givenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'given_by_user_id');
    }
}
