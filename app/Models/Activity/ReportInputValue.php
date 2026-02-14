<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;

/**
 * Rapor Input Değeri
 *
 * Öğretmenlerin günlük raporda doldurduğu her bir input'un değeri.
 * daily_child_report_id + report_template_input_id birleşik unique'dir.
 */
class ReportInputValue extends BaseModel
{
    protected $table = 'report_input_values';

    protected $fillable = [
        'daily_child_report_id',
        'report_template_input_id',
        'value',
        'created_by',
        'updated_by',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function dailyReport()
    {
        return $this->belongsTo(DailyChildReport::class, 'daily_child_report_id');
    }

    public function templateInput()
    {
        return $this->belongsTo(ReportTemplateInput::class, 'report_template_input_id');
    }
}
