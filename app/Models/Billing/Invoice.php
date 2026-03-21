<?php

namespace App\Models\Billing;

use App\Models\ActivityClass\ActivityClassInvoice;
use App\Models\Base\BaseModel;
use App\Models\School\School;
use App\Models\Tenant\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Fatura Modeli
 *
 * Hem B2B (Tenant abonelik ödemesi) hem B2C (Veli okul ödemesi) faturalarını yönetir.
 * Polimorfik bağlantı ile farklı ödeme kaynakları desteklenir.
 */
class Invoice extends BaseModel
{
    protected $table = 'invoices';

    protected $fillable = [
        'invoice_no',
        'tenant_id',
        'user_id',
        'school_id',
        'type',
        'module',
        'invoice_type',
        'original_invoice_id',
        'refund_reason',
        'status',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'currency',
        'notes',
        'issue_date',
        'due_date',
        'paid_at',
        'payable_type',
        'payable_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class)->withDefault();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withDefault();
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class)->withDefault();
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'invoice_id');
    }

    /**
     * Polimorfik ilişki — abonelik, kayıt talebi vb.
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function originalInvoice(): BelongsTo
    {
        return $this->belongsTo(self::class, 'original_invoice_id')->withDefault();
    }

    public function refundInvoice(): HasOne
    {
        return $this->hasOne(self::class, 'original_invoice_id');
    }

    public function activityClassInvoice(): HasOne
    {
        return $this->hasOne(ActivityClassInvoice::class, 'main_invoice_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForSchool($query, int $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Benzersiz fatura numarası üret — INV-2026-000001
     */
    public static function generateInvoiceNo(): string
    {
        $year = now()->format('Y');
        $prefix = "INV-{$year}-";

        $lastInvoice = static::withTrashed()
            ->where('invoice_no', 'like', $prefix.'%')
            ->orderByDesc('invoice_no')
            ->first();

        if ($lastInvoice) {
            $lastNumber = (int) str_replace($prefix, '', $lastInvoice->invoice_no);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix.str_pad($newNumber, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Fatura toplamlarını yeniden hesapla (kalemlerden)
     */
    public function recalculate(): self
    {
        $this->subtotal = $this->items()->sum('total_price');
        $this->tax_amount = round($this->subtotal * ($this->tax_rate / 100), 2);
        $this->total_amount = $this->subtotal + $this->tax_amount - $this->discount_amount;

        $this->save();

        return $this;
    }

    /**
     * Fatura ödendi olarak işaretle
     */
    public function markAsPaid(): self
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return $this;
    }

    /**
     * Faturanın başarılı transaction'ı var mı?
     */
    public function hasSuccessfulTransaction(): bool
    {
        return $this->transactions()->where('status', 1)->exists();
    }

    /**
     * Fatura ödendi mi?
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Vadesini geçmiş mi?
     */
    public function isOverdue(): bool
    {
        return $this->status === 'pending'
            && $this->due_date
            && now()->gt($this->due_date);
    }
}
