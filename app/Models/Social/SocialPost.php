<?php

namespace App\Models\Social;

use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\School\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Sosyal Ağ Paylaşımı
 *
 * Okul veya sınıf bazlı içerik paylaşım modeli.
 */
class SocialPost extends BaseModel
{
    protected $table = 'social_posts';

    protected $fillable = [
        'tenant_id', // nullable — global postlar için
        'school_id', // nullable — global postlar için
        'author_id',
        'title',
        'visibility',
        'content',
        'edit_history',
        'is_pinned',
        'is_global',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'is_global' => 'boolean',
            'published_at' => 'datetime',
            'edit_history' => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id')->withDefault();
    }

    public function media()
    {
        return $this->hasMany(SocialPostMedia::class, 'post_id')->orderBy('sort_order');
    }

    public function classes()
    {
        return $this->belongsToMany(
            SchoolClass::class,
            'social_post_class_tags',
            'post_id',
            'class_id'
        )->withTimestamps();
    }

    public function reactions()
    {
        return $this->hasMany(SocialPostReaction::class, 'post_id');
    }

    public function comments()
    {
        return $this->hasMany(SocialPostComment::class, 'post_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeForSchool(Builder $query, int $schoolId): Builder
    {
        return $query->where('school_id', $schoolId);
    }

    /**
     * Kullanıcıya göre görünür postları filtrele.
     *
     * - school_admin / teacher: okulun tüm postları
     * - parent: okul geneli + çocuklarının kayıtlı olduğu sınıfların postları
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        $isParent = $user->roles()->where('name', 'parent')->exists();

        if (! $isParent) {
            return $query;
        }

        // Velinin çocuklarının kayıtlı olduğu sınıf ID'leri
        $childClassIds = $user->familyProfiles()
            ->with('children.classes')
            ->get()
            ->flatMap(fn ($fp) => $fp->children)
            ->flatMap(fn ($child) => $child->classes->pluck('id'))
            ->unique()
            ->values();

        return $query->where(function (Builder $q) use ($childClassIds) {
            $q->where('visibility', 'school')
                ->orWhere(function (Builder $inner) use ($childClassIds) {
                    $inner->where('visibility', 'class')
                        ->whereHas('classes', fn (Builder $c) => $c->whereIn('classes.id', $childClassIds));
                });
        });
    }
}
