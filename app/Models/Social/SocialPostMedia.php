<?php

namespace App\Models\Social;

use App\Models\Base\BaseModel;

/**
 * Sosyal Post Medya Dosyası
 *
 * Post'a eklenmiş resim, video veya dosya.
 */
class SocialPostMedia extends BaseModel
{
    protected $table = 'social_post_media';

    protected $fillable = [
        'post_id',
        'type',
        'disk',
        'path',
        'thumbnail_path',
        'original_name',
        'file_size',
        'mime_type',
        'sort_order',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function post()
    {
        return $this->belongsTo(SocialPost::class, 'post_id')->withDefault();
    }
}
