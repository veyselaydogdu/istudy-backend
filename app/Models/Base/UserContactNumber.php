<?php

namespace App\Models\Base;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * UserContactNumber — Kullanıcı Ek İletişim Numarası
 *
 * Tüm kullanıcıların telefon numaraları haricinde
 * WhatsApp, Telegram, Signal, Viber vb. ek numara girişi.
 * Ülke kodu (country_id) ile uluslararası format desteği.
 */
class UserContactNumber extends BaseModel
{
    protected $table = 'user_contact_numbers';

    protected $fillable = [
        'user_id',
        'country_id',
        'type',
        'label',
        'phone_code',
        'number',
        'full_number',
        'is_primary',
        'is_verified',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_primary'  => 'boolean',
        'is_verified' => 'boolean',
        'sort_order'  => 'integer',
    ];

    /**
     * Geçerli iletişim türleri
     */
    public const TYPES = [
        'whatsapp'  => 'WhatsApp',
        'telegram'  => 'Telegram',
        'signal'    => 'Signal',
        'viber'     => 'Viber',
        'line'      => 'Line',
        'wechat'    => 'WeChat',
        'kakaotalk' => 'KakaoTalk',
        'imo'       => 'IMO',
        'skype'     => 'Skype',
        'phone'     => 'Telefon',
        'fax'       => 'Faks',
        'other'     => 'Diğer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopePrimary(Builder $query): Builder
    {
        return $query->where('is_primary', true);
    }

    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('is_verified', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('type');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators
    |--------------------------------------------------------------------------
    */

    /**
     * Tam numara otomatik oluştur
     */
    public function getFormattedNumberAttribute(): string
    {
        return "{$this->phone_code}{$this->number}";
    }

    /**
     * Tür etiketini döndür
     */
    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    /*
    |--------------------------------------------------------------------------
    | Boot — full_number otomatik güncelleme
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        static::saving(function (self $model) {
            $model->full_number = $model->phone_code . $model->number;
        });
    }
}
