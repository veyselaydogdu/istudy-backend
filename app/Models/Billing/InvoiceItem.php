<?php

namespace App\Models\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Fatura Kalemi Modeli
 *
 * Her fatura için bir veya birden fazla kalem (paket, çocuk kaydı, etkinlik vb.)
 * BaseModel kullanılmaz çünkü history tablosu yok ve tenant scope gerekmez.
 */
class InvoiceItem extends Model
{
    protected $table = 'invoice_items';

    protected $fillable = [
        'invoice_id',
        'description',
        'quantity',
        'unit_price',
        'total_price',
        'discount',
        'item_type',
        'item_id',
    ];

    protected $casts = [
        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
        'discount'    => 'decimal:2',
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

    /*
    |--------------------------------------------------------------------------
    | Boot — Otomatik toplam hesaplama
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        // Kalem kaydedilirken total_price otomatik hesapla
        static::saving(function (InvoiceItem $item) {
            $item->total_price = ($item->unit_price * $item->quantity) - $item->discount;
        });
    }
}
