<?php

namespace App\Traits;

use Illuminate\Support\Str;

/**
 * Hybrid ULID pattern: INT primary key internally, ULID exposed externally.
 *
 * Models using this trait:
 * - Auto-generate a ULID on the `creating` event if not already set
 * - Use ULID for route model binding (getRouteKeyName returns 'ulid')
 * - ULID is sortable and indexed; prevents sequential ID enumeration
 */
trait HasUlid
{
    public static function bootHasUlid(): void
    {
        static::creating(function ($model): void {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
        });
    }

    /**
     * Route model binding resolves via ULID, not the integer PK.
     */
    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    /**
     * Scope to find by ULID.
     */
    public function scopeByUlid($query, string $ulid): mixed
    {
        return $query->where($this->getTable().'.ulid', $ulid);
    }
}
