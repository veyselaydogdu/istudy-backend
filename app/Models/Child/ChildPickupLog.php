<?php

namespace App\Models\Child;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChildPickupLog extends Model
{
    protected $table = 'child_pickup_logs';

    protected $fillable = [
        'child_id',
        'authorized_pickup_id',
        'picked_by_name',
        'picked_by_photo',
        'picked_at',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'picked_at' => 'datetime',
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

    public function authorizedPickup(): BelongsTo
    {
        return $this->belongsTo(AuthorizedPickup::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
