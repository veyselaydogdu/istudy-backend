<?php

namespace App\Models\Billing;

use App\Models\Base\BaseModel;
use App\Models\School\School;
use App\Models\Tenant\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Ödeme Transaction Modeli
 *
 * Sanal POS üzerinden yapılan her ödeme denemesi için bir transaction oluşur.
 * Kullanıcı tekrar denediğinde yeni bir transaction oluşturulur.
 *
 * Status Değerleri:
 *   0 = Bekliyor (Pending) — Form oluşturuldu, POS'a gönderildi
 *   1 = Başarılı (Success) — POS olumlu döndü
 *   2 = Başarısız (Failed) — POS olumsuz döndü
 */
class Transaction extends BaseModel
{
    protected $table = 'transactions';

    // Status sabitleri
    const STATUS_PENDING = 0;
    const STATUS_SUCCESS = 1;
    const STATUS_FAILED  = 2;

    protected $fillable = [
        'order_id',
        'invoice_id',
        'user_id',
        'tenant_id',
        'school_id',
        'amount',
        'currency',
        'status',
        'payment_gateway',
        'hash',
        'bank_name',
        'card_last_four',
        'card_type',
        'installment',
        'gateway_request',
        'gateway_response',
        'gateway_transaction_id',
        'error_message',
        'error_code',
        'ip_address',
        'user_agent',
        'completed_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'status'           => 'integer',
        'installment'      => 'integer',
        'gateway_request'  => 'array',
        'gateway_response' => 'array',
        'completed_at'     => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withDefault();
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class)->withDefault();
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class)->withDefault();
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeForInvoice($query, int $invoiceId)
    {
        return $query->where('invoice_id', $invoiceId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Benzersiz order_id üret — TXN-{timestamp}-{random}
     */
    public static function generateOrderId(): string
    {
        do {
            $orderId = 'TXN-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(6));
        } while (static::where('order_id', $orderId)->exists());

        return $orderId;
    }

    /**
     * Sanal POS için hash oluştur
     * Parametreler POS firmasına göre değişecek, burada genel bir yapı kullanılıyor.
     */
    public static function generateHash(string $orderId, float $amount, string $currency = 'TRY'): string
    {
        $merchantKey = config('services.virtual_pos.merchant_key', '');
        $merchantSalt = config('services.virtual_pos.merchant_salt', '');

        $hashStr = $merchantKey . $orderId . $amount . $currency . $merchantSalt;

        return base64_encode(hash_hmac('sha256', $hashStr, $merchantKey, true));
    }

    /**
     * Transaction'ı başarılı olarak işaretle
     */
    public function markAsSuccess(array $gatewayResponse = []): self
    {
        $this->update([
            'status'                 => self::STATUS_SUCCESS,
            'gateway_response'       => $gatewayResponse,
            'gateway_transaction_id' => $gatewayResponse['transaction_id'] ?? null,
            'bank_name'              => $gatewayResponse['bank_name'] ?? $this->bank_name,
            'card_last_four'         => $gatewayResponse['card_last_four'] ?? $this->card_last_four,
            'card_type'              => $gatewayResponse['card_type'] ?? $this->card_type,
            'completed_at'           => now(),
        ]);

        return $this;
    }

    /**
     * Transaction'ı başarısız olarak işaretle
     */
    public function markAsFailed(array $gatewayResponse = [], ?string $errorMessage = null, ?string $errorCode = null): self
    {
        $this->update([
            'status'           => self::STATUS_FAILED,
            'gateway_response' => $gatewayResponse,
            'error_message'    => $errorMessage ?? ($gatewayResponse['error_message'] ?? 'Bilinmeyen hata'),
            'error_code'       => $errorCode ?? ($gatewayResponse['error_code'] ?? null),
            'completed_at'     => now(),
        ]);

        return $this;
    }

    /**
     * Status etiketini döndür
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Bekliyor',
            self::STATUS_SUCCESS => 'Başarılı',
            self::STATUS_FAILED  => 'Başarısız',
            default              => 'Bilinmiyor',
        };
    }

    /**
     * Beklemede mi?
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Başarılı mı?
     */
    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }

    /**
     * Başarısız mı?
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }
}
