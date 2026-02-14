<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;

/**
 * Döviz Kuru Güncelleme Logu
 *
 * API çağrılarının ve manuel güncellemelerin kaydını tutar.
 * Başarılı/başarısız durumlar, süre ve ham yanıtlar loga yazılır.
 */
class ExchangeRateLog extends Model
{
    protected $table = 'exchange_rate_logs';

    protected $fillable = [
        'source',
        'base_currency',
        'rates_count',
        'status',
        'error_message',
        'raw_response',
        'duration_ms',
        'fetched_at',
    ];

    protected $casts = [
        'raw_response' => 'array',
        'rates_count'  => 'integer',
        'duration_ms'  => 'integer',
        'fetched_at'   => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Başarılı log kaydı oluştur
     */
    public static function logSuccess(string $source, string $baseCurrency, int $ratesCount, int $durationMs, ?array $rawResponse = null): self
    {
        return static::create([
            'source'        => $source,
            'base_currency' => $baseCurrency,
            'rates_count'   => $ratesCount,
            'status'        => 'success',
            'duration_ms'   => $durationMs,
            'raw_response'  => $rawResponse,
            'fetched_at'    => now(),
        ]);
    }

    /**
     * Başarısız log kaydı oluştur
     */
    public static function logFailure(string $source, string $baseCurrency, string $errorMessage, int $durationMs, ?array $rawResponse = null): self
    {
        return static::create([
            'source'        => $source,
            'base_currency' => $baseCurrency,
            'rates_count'   => 0,
            'status'        => 'failed',
            'error_message' => $errorMessage,
            'duration_ms'   => $durationMs,
            'raw_response'  => $rawResponse,
            'fetched_at'    => now(),
        ]);
    }
}
