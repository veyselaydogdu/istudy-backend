<?php

namespace App\Models\Activity;

use App\Models\Base\BaseModel;
use App\Models\Child\Child;
use App\Models\User;

class DailyChildReport extends BaseModel
{
    protected $table = 'daily_child_reports';

    protected $fillable = [
        'child_id',
        'teacher_id',
        'report_template_id',
        'report_date',
        'mood',
        'appetite',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'report_date' => 'date',
    ];

    public function child()
    {
        return $this->belongsTo(Child::class, 'child_id')->withDefault();
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id')->withDefault();
    }

    public function inputValues()
    {
        return $this->hasMany(ReportInputValue::class, 'daily_child_report_id');
    }

    public function template()
    {
        return $this->belongsTo(ReportTemplate::class, 'report_template_id');
    }
}
