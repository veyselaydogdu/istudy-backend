<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\User;

/**
 * Ödev Tamamlama Durumu
 *
 * Her çocuğun ödev bazında tamamlama/teslim durumunu takip eder.
 */
class HomeworkCompletion extends BaseModel
{
    protected $table = 'homework_completions';

    protected $fillable = [
        'homework_id',
        'child_id',
        'is_completed',
        'completed_at',
        'notes',
        'marked_by',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function homework()
    {
        return $this->belongsTo(Homework::class);
    }

    public function child()
    {
        return $this->belongsTo(Child::class);
    }

    public function markedByUser()
    {
        return $this->belongsTo(User::class, 'marked_by')->withDefault();
    }
}
