<?php

namespace App\Models\Billing;

use App\Models\Base\BaseModel;
use App\Models\School\School;

class RevenueShare extends BaseModel
{
    protected $table = 'revenue_shares';

    protected $fillable = [
        'payment_id',
        'school_id',
        'percentage',
        'amount',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'amount' => 'decimal:2',
    ];
    
    public function school() { return $this->belongsTo(School::class)->withDefault(); }
    public function payment() { return $this->belongsTo(Payment::class)->withDefault(); }
}
