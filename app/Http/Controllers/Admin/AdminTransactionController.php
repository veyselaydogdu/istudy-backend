<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\TransactionResource;
use App\Models\Billing\Transaction;
use App\Services\InvoiceService;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin Transaction Controller
 *
 * Süper admin tüm fatura ve transaction'ları görüntüleyebilir,
 * filtreleyebilir ve istatistiklere erişebilir.
 */
class AdminTransactionController extends BaseController
{
    public function __construct(
        protected TransactionService $transactionService,
        protected InvoiceService $invoiceService
    ) {}

    /**
     * Tüm transaction'ları listele (filtreleme destekli)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'status', 'payment_gateway', 'school_id', 'tenant_id',
                'start_date', 'end_date', 'search', 'per_page',
            ]);

            $transactions = $this->transactionService->listAll($filters);

            return $this->paginatedResponse(
                TransactionResource::collection($transactions)
            );
        } catch (\Throwable $e) {
            Log::error('AdminTransactionController::index Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Transaction detayı
     */
    public function show(int $id): JsonResponse
    {
        try {
            $transaction = Transaction::withoutGlobalScope('tenant')
                ->with(['invoice.items', 'user', 'school', 'tenant'])
                ->findOrFail($id);

            return $this->successResponse(
                TransactionResource::make($transaction),
                'Transaction detayı.'
            );
        } catch (\Throwable $e) {
            Log::error('AdminTransactionController::show Error', [
                'message' => $e->getMessage(),
                'id' => $id,
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Transaction istatistikleri
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['school_id', 'tenant_id', 'start_date', 'end_date']);

            $stats = $this->transactionService->getStats($filters);

            return $this->successResponse($stats, 'Transaction istatistikleri.');
        } catch (\Throwable $e) {
            Log::error('AdminTransactionController::stats Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Aylık transaction özeti (grafik verisi)
     */
    public function monthlyStats(Request $request): JsonResponse
    {
        try {
            $months = $request->input('months', 12);
            $stats = $this->transactionService->getMonthlyStats((int) $months);

            return $this->successResponse($stats, 'Aylık transaction özeti.');
        } catch (\Throwable $e) {
            Log::error('AdminTransactionController::monthlyStats Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Tüm faturaları listele (Admin)
     */
    public function invoices(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'status', 'type', 'tenant_id', 'school_id',
                'user_id', 'search', 'per_page',
            ]);

            $invoices = $this->invoiceService->listAll($filters);

            return $this->paginatedResponse(
                InvoiceResource::collection($invoices)
            );
        } catch (\Throwable $e) {
            Log::error('AdminTransactionController::invoices Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Fatura istatistikleri
     */
    public function invoiceStats(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->input('tenant_id');
            $stats = $this->invoiceService->getStats($tenantId ? (int) $tenantId : null);

            return $this->successResponse($stats, 'Fatura istatistikleri.');
        } catch (\Throwable $e) {
            Log::error('AdminTransactionController::invoiceStats Error', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Belirli bir okula ait transaction'lar
     */
    public function schoolTransactions(Request $request, int $schoolId): JsonResponse
    {
        try {
            $filters = $request->only(['status', 'start_date', 'end_date', 'per_page']);

            $transactions = $this->transactionService->listForSchool($schoolId, $filters);

            return $this->paginatedResponse(
                TransactionResource::collection($transactions)
            );
        } catch (\Throwable $e) {
            Log::error('AdminTransactionController::schoolTransactions Error', [
                'message' => $e->getMessage(),
                'school_id' => $schoolId,
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
