<?php

namespace App\Models\Activity;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\School\School;

/**
 * Material — Sınıf İhtiyaç Listesi Kalemi
 *
 * Sınıfa öğretmen/yönetici tarafından eklenen malzeme/ihtiyaç listeleri.
 * Veliler bu listeden hangi malzemeleri temin etmesi gerektiğini görür.
 */
class Material extends BaseModel
{
    protected $table = 'materials';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'class_id',
        'name',
        'description',
        'quantity',
        'due_date',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'due_date' => 'date',
        'quantity' => 'integer',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id')->withDefault();
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id')->withDefault();
    }
}
