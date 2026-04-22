<?php

namespace App\Models\Social;

use App\Models\Base\BaseModel;
use App\Models\User;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Sosyal Post Yorumu
 *
 * Yorum ve yanıt (reply) desteği ile.
 */
class SocialPostComment extends BaseModel
{
    use SoftDeletes;

    protected $table = 'social_post_comments';

    protected $fillable = [
        'post_id',
        'user_id',
        'parent_id',
        'content',
        'created_by',
        'updated_by',
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

    public function parent()
    {
        return $this->belongsTo(SocialPostComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(SocialPostComment::class, 'parent_id');
    }

    public function likes()
    {
        return $this->hasMany(SocialPostCommentReaction::class, 'comment_id');
    }
}
