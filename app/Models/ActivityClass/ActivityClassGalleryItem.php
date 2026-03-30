<?php

namespace App\Models\ActivityClass;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityClassGalleryItem extends Model
{
    use SoftDeletes;

    protected $table = 'activity_class_gallery';

    protected $fillable = [
        'activity_class_id',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
        'caption',
        'sort_order',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function activityClass()
    {
        return $this->belongsTo(ActivityClass::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by')->withDefault();
    }
}
