<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;

/**
 * Rapor Şablon İnputu
 *
 * Her rapor şablonundaki dinamik alan tanımı.
 * Tip: text, number, select, rating, boolean, textarea
 * Select tipinde `options` JSON ile seçenekler tanımlanır.
 */
class ReportTemplateInput extends BaseModel
{
    protected $table = 'report_template_inputs';

    protected $fillable = [
        'report_template_id',
        'label',
        'input_type',
        'options',
        'is_required',
        'sort_order',
        'default_value',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function template()
    {
        return $this->belongsTo(ReportTemplate::class, 'report_template_id');
    }

    public function values()
    {
        return $this->hasMany(ReportInputValue::class);
    }
}
