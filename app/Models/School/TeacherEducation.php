<?php

namespace App\Models\School;

use App\Models\Base\BaseModel;
use App\Models\Base\Country;

/**
 * TeacherEducation — Öğretmen Eğitim Geçmişi
 *
 * Lisans, Yüksek Lisans, Doktora, Ön Lisans vb.
 * Onay gerektirmez (eğitim geçmişi bilgi amaçlı).
 */
class TeacherEducation extends BaseModel
{
    protected $table = 'teacher_educations';

    protected $fillable = [
        'teacher_profile_id',
        'institution',
        'degree',
        'field_of_study',
        'start_date',
        'end_date',
        'is_current',
        'gpa',
        'description',
        'country_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'is_current' => 'boolean',
        'gpa'        => 'decimal:2',
    ];

    /**
     * Eğitim dereceleri
     */
    public const DEGREES = [
        'high_school'    => 'Lise',
        'associate'      => 'Ön Lisans',
        'bachelor'       => 'Lisans',
        'master'         => 'Yüksek Lisans',
        'doctorate'      => 'Doktora',
        'postdoctoral'   => 'Post-Doktora',
        'certificate'    => 'Sertifika Programı',
        'other'          => 'Diğer',
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

    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Derece etiketini döndür
     */
    public function getDegreeLabelAttribute(): string
    {
        return self::DEGREES[$this->degree] ?? $this->degree;
    }

    /**
     * Eğitim süresi (hesaplama)
     */
    public function getDurationAttribute(): ?string
    {
        if (! $this->start_date) {
            return null;
        }

        $end = $this->is_current ? now() : ($this->end_date ?? now());

        return $this->start_date->diffForHumans($end, true);
    }
}
