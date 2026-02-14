<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\TransactionResource;
use App\Models\Billing\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Fatura Controller (Kullanıcı & Tenant tarafı)
 *
 * Fatura listeleme, detay görme, ödeme başlatma ve
 * sanal POS callback işlemlerini yönetir.
 */
class InvoiceController extends BaseController
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    /**
     * Kullanıcının faturalarını listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['status', 'type', 'school_id', 'per_page']);
            $invoices = $this->invoiceService->listForUser($this->user()->id, $filters);

            return $this->paginatedResponse(
                InvoiceResource::collection($invoices)->resource
            );
        } catch (\Throwable $e) {
            Log::error('InvoiceController::index Error', [
                'message' => $e->getMessage(),
                'user_id' => $this->user()->id,
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Tenant faturalarını listele (B2B)
     */
    public function tenantInvoices(Request $request): JsonResponse
    {
        try {
            $tenantId = $this->user()->tenant_id;

            if (! $tenantId) {
                return $this->errorResponse('Bir kuruma bağlı değilsiniz.', 403);
            }

            $filters = $request->only(['status', 'per_page']);
            $invoices = $this->invoiceService->listForTenant($tenantId, $filters);

            return $this->paginatedResponse(
                InvoiceResource::collection($invoices)->resource
            );
        } catch (\Throwable $e) {
            Log::error('InvoiceController::tenantInvoices Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Fatura detayını göster (kalemler + transactions ile)
     */
    public function show(Invoice $invoice): JsonResponse
    {
        try {
            // Yetki kontrolü — sadece kendi faturasını görsün
            if ($invoice->user_id !== $this->user()->id && ! $this->user()->isSuperAdmin()) {
                return $this->errorResponse('Bu faturayı görüntüleme yetkiniz yok.', 403);
            }

            $invoice->load(['items', 'transactions', 'user', 'school', 'tenant']);

            return $this->successResponse(
                InvoiceResource::make($invoice),
                'Fatura detayı.'
            );
        } catch (\Throwable $e) {
            Log::error('InvoiceController::show Error', [
                'message'    => $e->getMessage(),
                'invoice_id' => $invoice->id ?? null,
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Yeni fatura oluştur (B2B veya B2C)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type'             => 'required|in:subscription,enrollment,manual,other',
            'school_id'        => 'nullable|exists:schools,id',
            'tax_rate'         => 'nullable|numeric|min:0|max:100',
            'discount_amount'  => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string|max:1000',
            'due_date'         => 'nullable|date|after_or_equal:today',
            'items'            => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.discount'    => 'nullable|numeric|min:0',
            'items.*.item_type'   => 'nullable|string|max:50',
            'items.*.item_id'     => 'nullable|integer',
        ]);

        try {
            DB::beginTransaction();

            $data = [
                'user_id'         => $this->user()->id,
                'tenant_id'       => $this->user()->tenant_id,
                'school_id'       => $request->school_id,
                'type'            => $request->type,
                'tax_rate'        => $request->tax_rate ?? 0,
                'discount_amount' => $request->discount_amount ?? 0,
                'notes'           => $request->notes,
                'due_date'        => $request->due_date,
            ];

            $invoice = $this->invoiceService->createInvoice($data, $request->items);

            DB::commit();

            return $this->successResponse(
                InvoiceResource::make($invoice->load(['items'])),
                'Fatura başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('InvoiceController::store Error', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Ödeme başlat — Transaction oluştur + Hash üret + Form verisi döndür
     *
     * Kullanıcı "Ödeme Yap" butonuna bastığında çağrılır.
     * Her çağrıda benzersiz yeni bir transaction oluşturulur.
     */
    public function initiatePayment(Request $request, Invoice $invoice): JsonResponse
    {
        $request->validate([
            'payment_gateway' => 'nullable|string|in:paytr,iyzico,param,stripe',
            'installment'     => 'nullable|integer|min:1|max:12',
        ]);

        try {
            // Yetki kontrolü
            if ($invoice->user_id !== $this->user()->id && ! $this->user()->isSuperAdmin()) {
                return $this->errorResponse('Bu fatura için ödeme başlatma yetkiniz yok.', 403);
            }

            $paymentData = $request->only(['payment_gateway', 'installment']);

            $result = $this->invoiceService->initiatePayment($invoice, $paymentData);

            return $this->successResponse([
                'transaction' => TransactionResource::make($result['transaction']),
                'order_id'    => $result['order_id'],
                'hash'        => $result['hash'],
                'form_data'   => $result['form_data'],
                'payment_url' => $result['payment_url'],
                'method'      => $result['payment_method'],
            ], 'Ödeme işlemi başlatıldı. Form verilerini sanal POS URL\'sine POST edin.');
        } catch (\Throwable $e) {
            Log::error('InvoiceController::initiatePayment Error', [
                'message'    => $e->getMessage(),
                'invoice_id' => $invoice->id,
            ]);

            $code = $e->getCode() === 400 ? 400 : 500;

            return $this->errorResponse($e->getMessage(), $code);
        }
    }

    /**
     * Sanal POS başarılı callback (Success URL)
     *
     * Sanal POS firması bu endpoint'e POST yapar.
     * Auth gerektirmez (webhook).
     */
    public function paymentSuccess(Request $request): JsonResponse
    {
        try {
            $orderId = $request->input('order_id') ?? $request->input('merchant_oid');

            if (! $orderId) {
                return $this->errorResponse('order_id bulunamadı.', 400);
            }

            // Hash doğrulama (POS firmasına göre güncellenir)
            // $this->verifyCallbackHash($request);

            $transaction = $this->invoiceService->handlePaymentSuccess(
                $orderId,
                $request->all()
            );

            return $this->successResponse(
                TransactionResource::make($transaction),
                'Ödeme başarıyla tamamlandı.'
            );
        } catch (\Throwable $e) {
            Log::error('InvoiceController::paymentSuccess Error', [
                'message'   => $e->getMessage(),
                'order_id'  => $request->input('order_id'),
                'full_data' => $request->all(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Sanal POS başarısız callback (Fail URL)
     *
     * Sanal POS firması bu endpoint'e POST yapar.
     * Auth gerektirmez (webhook).
     */
    public function paymentFail(Request $request): JsonResponse
    {
        try {
            $orderId = $request->input('order_id') ?? $request->input('merchant_oid');

            if (! $orderId) {
                return $this->errorResponse('order_id bulunamadı.', 400);
            }

            $transaction = $this->invoiceService->handlePaymentFailure(
                $orderId,
                $request->all()
            );

            return $this->successResponse(
                TransactionResource::make($transaction),
                'Ödeme başarısız oldu.'
            );
        } catch (\Throwable $e) {
            Log::error('InvoiceController::paymentFail Error', [
                'message'   => $e->getMessage(),
                'order_id'  => $request->input('order_id'),
                'full_data' => $request->all(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Sanal POS callback (Webhook — arka plan doğrulama)
     *
     * Bazı POS firmaları ayrıca bir callback/notify URL ister.
     * Bu endpoint aynı başarı/başarısız mantığını işler.
     */
    public function paymentCallback(Request $request): JsonResponse
    {
        try {
            $orderId = $request->input('order_id') ?? $request->input('merchant_oid');
            $status  = $request->input('status') ?? $request->input('payment_status');

            if (! $orderId) {
                return $this->errorResponse('order_id bulunamadı.', 400);
            }

            if ($status === 'success' || $status === '1' || $status === 'approved') {
                $transaction = $this->invoiceService->handlePaymentSuccess($orderId, $request->all());
            } else {
                $transaction = $this->invoiceService->handlePaymentFailure($orderId, $request->all());
            }

            return $this->successResponse(
                TransactionResource::make($transaction),
                'Callback işlendi.'
            );
        } catch (\Throwable $e) {
            Log::error('InvoiceController::paymentCallback Error', [
                'message'   => $e->getMessage(),
                'full_data' => $request->all(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Faturanın transaction geçmişini listele
     */
    public function transactions(Invoice $invoice): JsonResponse
    {
        try {
            if ($invoice->user_id !== $this->user()->id && ! $this->user()->isSuperAdmin()) {
                return $this->errorResponse('Bu faturayı görüntüleme yetkiniz yok.', 403);
            }

            $transactions = $invoice->transactions()
                ->latest()
                ->get();

            return $this->successResponse(
                TransactionResource::collection($transactions),
                'Fatura transaction geçmişi.'
            );
        } catch (\Throwable $e) {
            Log::error('InvoiceController::transactions Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
