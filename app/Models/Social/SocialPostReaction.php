<?php

namespace App\Models\Social;

use App\Models\Base\BaseModel;
use App\Models\User;

/**
 * Sosyal Post Tepkisi (Beğeni)
 *
 * Kullanıcının bir posta verdiği tepki (like, heart, clap).
 */
class SocialPostReaction extends BaseModel
{
    protected $table = 'social_post_reactions';

    protected $fillable = [
        'post_id',
        'user_id',
        'type',
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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withDefault();
    }
}
