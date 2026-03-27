<?php

namespace App\Models\Activity;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityGalleryItem extends Model
{
    use SoftDeletes;

    protected $table = 'activity_gallery';

    protected $fillable = [
        'activity_id',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
        'file_type',
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

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by')->withDefault();
    }
}
