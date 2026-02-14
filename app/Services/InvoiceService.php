<?php

namespace App\Services;

use App\Models\Billing\Invoice;
use App\Models\Billing\InvoiceItem;
use App\Models\Billing\Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Fatura Servisi
 *
 * Fatura oluşturma, güncelleme, kalem ekleme, ödeme başlatma işlemlerini yönetir.
 */
class InvoiceService extends BaseService
{
    protected function model(): string
    {
        return Invoice::class;
    }

    /*
    |--------------------------------------------------------------------------
    | Fatura Listeleme
    |--------------------------------------------------------------------------
    */

    /**
     * Kullanıcının faturalarını listele
     */
    public function listForUser(int $userId, array $filters = []): LengthAwarePaginator
    {
        $query = Invoice::forUser($userId)
            ->with(['items', 'transactions', 'school', 'tenant']);

        if (! empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['school_id'])) {
            $query->forSchool($filters['school_id']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Tenant'ın faturalarını listele (B2B)
     */
    public function listForTenant(int $tenantId, array $filters = []): LengthAwarePaginator
    {
        $query = Invoice::forTenant($tenantId)
            ->with(['items', 'transactions']);

        if (! empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Admin: Tüm faturaları listele (global scope geçilir)
     */
    public function listAll(array $filters = []): LengthAwarePaginator
    {
        $query = Invoice::withoutGlobalScope('tenant')
            ->with(['items', 'transactions', 'user', 'school', 'tenant']);

        if (! empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['tenant_id'])) {
            $query->forTenant($filters['tenant_id']);
        }

        if (! empty($filters['school_id'])) {
            $query->forSchool($filters['school_id']);
        }

        if (! empty($filters['user_id'])) {
            $query->forUser($filters['user_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | Fatura Oluşturma
    |--------------------------------------------------------------------------
    */

    /**
     * Yeni fatura oluştur + kalemlerini ekle
     *
     * @param array $data    Fatura verileri
     * @param array $items   Fatura kalemleri [['description'=>'...', 'quantity'=>1, 'unit_price'=>100, ...], ...]
     */
    public function createInvoice(array $data, array $items = []): Invoice
    {
        return DB::transaction(function () use ($data, $items) {
            // Fatura numarası üret
            $data['invoice_no'] = Invoice::generateInvoiceNo();
            $data['issue_date'] = $data['issue_date'] ?? now()->toDateString();
            $data['due_date']   = $data['due_date'] ?? now()->addDays(7)->toDateString();
            $data['status']     = $data['status'] ?? 'pending';
            $data['created_by'] = $data['created_by'] ?? auth()->id();

            $invoice = Invoice::create($data);

            // Kalemleri ekle
            foreach ($items as $item) {
                $invoice->items()->create($item);
            }

            // Toplamları hesapla
            $invoice->recalculate();

            return $invoice->fresh(['items']);
        });
    }

    /**
     * Fatura kalemi ekle
     */
    public function addItem(Invoice $invoice, array $itemData): InvoiceItem
    {
        $item = $invoice->items()->create($itemData);

        // Toplamları yeniden hesapla
        $invoice->recalculate();

        return $item;
    }

    /**
     * Fatura kalemi kaldır
     */
    public function removeItem(Invoice $invoice, int $itemId): void
    {
        $invoice->items()->where('id', $itemId)->delete();

        // Toplamları yeniden hesapla
        $invoice->recalculate();
    }

    /*
    |--------------------------------------------------------------------------
    | Ödeme İşlemi Başlatma
    |--------------------------------------------------------------------------
    */

    /**
     * Ödeme başlat — Transaction oluştur + hash üret + form verisi hazırla
     *
     * Kullanıcı "Ödeme Yap" butonuna bastığında bu fonksiyon çağrılır.
     * Her tıklamada yeni bir transaction oluşturulur (retry senaryosu).
     */
    public function initiatePayment(Invoice $invoice, array $paymentData = []): array
    {
        // Zaten ödenmişse hata
        if ($invoice->isPaid()) {
            throw new \Exception('Bu fatura zaten ödenmiş.', 400);
        }

        // Benzersiz order_id oluştur
        $orderId = Transaction::generateOrderId();

        // Hash oluştur (sanal POS güvenlik)
        $hash = Transaction::generateHash($orderId, (float) $invoice->total_amount, $invoice->currency);

        // Transaction kaydı oluştur — status: 0 (Bekliyor)
        $transaction = Transaction::create([
            'order_id'        => $orderId,
            'invoice_id'      => $invoice->id,
            'user_id'         => $invoice->user_id,
            'tenant_id'       => $invoice->tenant_id,
            'school_id'       => $invoice->school_id,
            'amount'          => $invoice->total_amount,
            'currency'        => $invoice->currency,
            'status'          => Transaction::STATUS_PENDING,
            'payment_gateway' => $paymentData['payment_gateway'] ?? config('services.virtual_pos.default_gateway', 'paytr'),
            'hash'            => $hash,
            'installment'     => $paymentData['installment'] ?? 1,
            'ip_address'      => request()->ip(),
            'user_agent'      => request()->userAgent(),
            'created_by'      => auth()->id(),
        ]);

        // Sanal POS'a gönderilecek form verisi
        $formData = $this->buildPaymentForm($transaction, $invoice, $paymentData);

        // İstek verisini transaction'a kaydet
        $transaction->update([
            'gateway_request' => $formData,
        ]);

        return [
            'transaction'    => $transaction,
            'order_id'       => $orderId,
            'hash'           => $hash,
            'form_data'      => $formData,
            'payment_url'    => config('services.virtual_pos.payment_url', ''),
            'payment_method' => 'POST',
        ];
    }

    /**
     * Sanal POS form verisi oluştur
     *
     * Not: Bu alanlar sanal POS firmasına göre değişecektir (PayTR, iyzico, Param vb.)
     * Şu an genel bir yapı kullanılıyor, entegrasyon sırasında güncellenir.
     */
    private function buildPaymentForm(Transaction $transaction, Invoice $invoice, array $paymentData): array
    {
        return [
            'merchant_id'     => config('services.virtual_pos.merchant_id', ''),
            'merchant_key'    => config('services.virtual_pos.merchant_key', ''),
            'order_id'        => $transaction->order_id,
            'amount'          => (int) ($transaction->amount * 100), // Kuruş cinsinden
            'currency'        => $transaction->currency,
            'installment'     => $transaction->installment,
            'user_name'       => $invoice->user->name ?? '',
            'user_email'      => $invoice->user->email ?? '',
            'user_phone'      => $invoice->user->phone ?? '',
            'user_ip'         => $transaction->ip_address,
            'hash'            => $transaction->hash,
            'success_url'     => config('services.virtual_pos.success_url', ''),
            'fail_url'        => config('services.virtual_pos.fail_url', ''),
            'callback_url'    => config('services.virtual_pos.callback_url', ''),
            'user_basket'     => $this->buildBasketItems($invoice),
        ];
    }

    /**
     * Sepet kalemlerini sanal POS formatında hazırla
     */
    private function buildBasketItems(Invoice $invoice): array
    {
        return $invoice->items->map(function (InvoiceItem $item) {
            return [
                'name'  => $item->description,
                'price' => (int) ($item->total_price * 100), // Kuruş
                'qty'   => $item->quantity,
            ];
        })->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | Sanal POS Callback İşlemleri
    |--------------------------------------------------------------------------
    */

    /**
     * Sanal POS başarılı callback — status 1 yap
     */
    public function handlePaymentSuccess(string $orderId, array $gatewayResponse): Transaction
    {
        return DB::transaction(function () use ($orderId, $gatewayResponse) {
            $transaction = Transaction::where('order_id', $orderId)->firstOrFail();

            // Transaction'ı başarılı yap
            $transaction->markAsSuccess($gatewayResponse);

            // Faturayı ödendi olarak işaretle
            $transaction->invoice->markAsPaid();

            Log::info('Ödeme başarılı', [
                'order_id'   => $orderId,
                'invoice_id' => $transaction->invoice_id,
                'amount'     => $transaction->amount,
            ]);

            return $transaction->fresh(['invoice']);
        });
    }

    /**
     * Sanal POS başarısız callback — status 2 yap
     */
    public function handlePaymentFailure(string $orderId, array $gatewayResponse): Transaction
    {
        $transaction = Transaction::where('order_id', $orderId)->firstOrFail();

        $errorMessage = $gatewayResponse['error_message'] ?? 'Ödeme başarısız oldu.';
        $errorCode = $gatewayResponse['error_code'] ?? null;

        $transaction->markAsFailed($gatewayResponse, $errorMessage, $errorCode);

        Log::warning('Ödeme başarısız', [
            'order_id'      => $orderId,
            'invoice_id'    => $transaction->invoice_id,
            'error_message' => $errorMessage,
            'error_code'    => $errorCode,
        ]);

        return $transaction->fresh(['invoice']);
    }

    /*
    |--------------------------------------------------------------------------
    | İstatistikler
    |--------------------------------------------------------------------------
    */

    /**
     * Fatura istatistiklerini döndür
     */
    public function getStats(?int $tenantId = null): array
    {
        $query = Invoice::withoutGlobalScope('tenant');

        if ($tenantId) {
            $query->forTenant($tenantId);
        }

        return [
            'total_invoices'  => (clone $query)->count(),
            'draft_count'     => (clone $query)->byStatus('draft')->count(),
            'pending_count'   => (clone $query)->byStatus('pending')->count(),
            'paid_count'      => (clone $query)->byStatus('paid')->count(),
            'cancelled_count' => (clone $query)->byStatus('cancelled')->count(),
            'total_revenue'   => (clone $query)->byStatus('paid')->sum('total_amount'),
            'pending_revenue' => (clone $query)->byStatus('pending')->sum('total_amount'),
        ];
    }
}
