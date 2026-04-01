<?php

namespace App\Models\School;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class TeacherFollow extends Model
{
    protected $table = 'teacher_follows';

    public const UPDATED_AT = null;

    protected $fillable = [
        'teacher_profile_id',
        'user_id',
    ];

    public function teacher(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class, 'teacher_profile_id');
    }

    public function follower(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
