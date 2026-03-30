<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;

/**
 * Duyuru
 *
 * Okul ve sınıf bazlı duyuru sistemi.
 * Sabitleme, zamanlama ve süre sonu desteği ile.
 */
class Announcement extends BaseModel
{
    protected $table = 'announcements';

    protected $fillable = [
        'school_id',
        'class_id',
        'title',
        'body',
        'type',
        'is_pinned',
        'publish_at',
        'expire_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'publish_at' => 'datetime',
        'expire_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(\App\Models\Academic\SchoolClass::class, 'class_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePublished($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('publish_at')
              ->orWhere('publish_at', '<=', now());
        });
    }

    public function scopeActive($query)
    {
        return $query->published()
            ->where(function ($q) {
                $q->whereNull('expire_at')
                  ->orWhere('expire_at', '>=', now());
            });
    }

    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    public function scopeSchoolWide($query)
    {
        return $query->whereNull('class_id');
    }

    public function scopeForClass($query, int $classId)
    {
        return $query->where(function ($q) use ($classId) {
            $q->where('class_id', $classId)
              ->orWhereNull('class_id'); // Okul geneli duyurular dahil
        });
    }
}
