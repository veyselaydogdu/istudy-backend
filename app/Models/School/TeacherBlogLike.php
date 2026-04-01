<?php

namespace App\Models\School;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class TeacherBlogLike extends Model
{
    protected $table = 'teacher_blog_likes';

    public const UPDATED_AT = null;

    protected $fillable = [
        'blog_post_id',
        'user_id',
    ];

    public function post(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(TeacherBlogPost::class, 'blog_post_id');
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
