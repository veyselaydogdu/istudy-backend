<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;
use App\Models\School\School;

/**
 * Rapor Şablonu
 *
 * Okullar kendi rapor şablonlarını oluşturabilir.
 * Her şablon birden fazla input alanı içerir.
 * Öğretmenler bu inputları doldurur, raporlar oluşturulur.
 */
class ReportTemplate extends BaseModel
{
    protected $table = 'report_templates';

    protected $fillable = [
        'school_id',
        'name',
        'description',
        'frequency',
        'is_active',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
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

    public function inputs()
    {
        return $this->hasMany(ReportTemplateInput::class)->orderBy('sort_order');
    }

    public function dailyReports()
    {
        return $this->hasMany(DailyChildReport::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
