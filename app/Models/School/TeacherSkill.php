<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;

/**
 * TeacherSkill — Öğretmen Yetenekleri & Uzmanlık Alanları
 *
 * Dil, teknoloji, pedagoji, sanat, spor, müzik vb. kategorilerde
 * yetkinlik seviyesi ve yüzdesiyle birlikte.
 */
class TeacherSkill extends BaseModel
{
    protected $table = 'teacher_skills';

    protected $fillable = [
        'teacher_profile_id',
        'name',
        'level',
        'category',
        'proficiency',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'proficiency' => 'integer',
    ];

    public const LEVELS = [
        'beginner'     => 'Başlangıç',
        'intermediate' => 'Orta',
        'advanced'     => 'İleri',
        'expert'       => 'Uzman',
    ];

    public const CATEGORIES = [
        'language'   => 'Dil',
        'technology' => 'Teknoloji',
        'pedagogy'   => 'Pedagoji',
        'art'        => 'Sanat',
        'sport'      => 'Spor',
        'music'      => 'Müzik',
        'science'    => 'Fen Bilimleri',
        'other'      => 'Diğer',
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

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    public function getLevelLabelAttribute(): string
    {
        return self::LEVELS[$this->level] ?? $this->level;
    }

    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }
}
