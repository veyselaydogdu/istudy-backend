<?php

namespace App\Http\Controllers\Parents;

use App\Models\ActivityClass\ActivityClassEnrollment;
use App\Models\Billing\Invoice;
use App\Models\Child\Child;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ParentInvoiceController extends BaseParentController
{
    /**
     * Velinin tüm faturalarını ana invoices tablosundan listele.
     *
     * Kapsam:
     * 1. Velinin kendi user_id'sine ait tüm faturalar (veli kayıt yaptırdığında)
     * 2. Tenant'ın aile çocukları için oluşturduğu etkinlik sınıfı faturaları
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = $this->buildBaseQuery();

            if ($request->filled('status')) {
                $query->byStatus($request->input('status'));
            }

            if ($request->filled('invoice_type')) {
                $query->where('invoice_type', $request->input('invoice_type'));
            }

            $perPage = min((int) ($request->input('per_page', 15)), 50);

            $invoices = $query->with([
                'items',
                'activityClassInvoice.child:id,first_name,last_name',
            ])->latest()->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Faturalar listelendi.',
                'data' => $invoices->getCollection()->map(fn (Invoice $inv) => $this->formatInvoice($inv)),
                'meta' => [
                    'current_page' => $invoices->currentPage(),
                    'last_page' => $invoices->lastPage(),
                    'per_page' => $invoices->perPage(),
                    'total' => $invoices->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('ParentInvoiceController::index', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Fatura istatistikleri
     */
    public function stats(): JsonResponse
    {
        try {
            $base = $this->buildBaseQuery()->where('invoice_type', 'invoice');

            return $this->successResponse([
                'total' => (clone $base)->count(),
                'pending_count' => (clone $base)->where('status', 'pending')->count(),
                'paid_count' => (clone $base)->where('status', 'paid')->count(),
                'overdue_count' => (clone $base)->where('status', 'pending')->whereDate('due_date', '<', now())->count(),
                'pending_amount' => (clone $base)->where('status', 'pending')->sum('total_amount'),
            ]);
        } catch (\Throwable $e) {
            Log::error('ParentInvoiceController::stats', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /**
     * Fatura detayı
     */
    public function show(Invoice $invoice): JsonResponse
    {
        try {
            // Erişim kontrolü: fatura bu veliye ait mi?
            if (! $this->belongsToParent($invoice)) {
                return $this->errorResponse('Fatura bulunamadı.', 404);
            }

            $invoice->load([
                'items',
                'transactions',
                'activityClassInvoice' => fn ($q) => $q->with([
                    'activityClass:id,name,location,schedule,start_date,end_date',
                    'child:id,first_name,last_name',
                    'refundInvoice:id,invoice_number,status',
                    'originalInvoice:id,invoice_number,amount,currency,status',
                ]),
            ]);

            return $this->successResponse($this->formatInvoice($invoice, true));
        } catch (\Throwable $e) {
            Log::error('ParentInvoiceController::show', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Yardımcı Metodlar
    |--------------------------------------------------------------------------
    */

    /**
     * Veliye ait faturaları döndüren temel sorgu.
     * Hem veli tarafından hem de tenant tarafından oluşturulan faturaları kapsar.
     */
    private function buildBaseQuery(): \Illuminate\Database\Eloquent\Builder
    {
        $userId = $this->user()->id;

        // Aile profiline bağlı çocukların kayıt ID'leri (tenant tarafından oluşturulan faturalar için)
        $enrollmentIds = $this->getFamilyEnrollmentIds();

        return Invoice::withoutGlobalScope('tenant')
            ->where(function ($q) use ($userId, $enrollmentIds) {
                // Veli kendi kayıt yaptırdığında oluşan faturalar
                $q->where('user_id', $userId);

                // Tenant çocuğu kaydettirdiğinde oluşan faturalar (payable = enrollment)
                if ($enrollmentIds->isNotEmpty()) {
                    $q->orWhere(function ($q2) use ($enrollmentIds) {
                        $q2->where('payable_type', ActivityClassEnrollment::class)
                            ->whereIn('payable_id', $enrollmentIds);
                    });
                }
            });
    }

    /**
     * Ailenin çocuklarına ait tüm kayıt (enrollment) ID'lerini döndür.
     */
    private function getFamilyEnrollmentIds(): \Illuminate\Support\Collection
    {
        $familyProfile = $this->getFamilyProfile();

        if (! $familyProfile) {
            return collect();
        }

        $childIds = Child::withoutGlobalScope('tenant')
            ->where('family_profile_id', $familyProfile->id)
            ->pluck('id');

        if ($childIds->isEmpty()) {
            return collect();
        }

        return ActivityClassEnrollment::withTrashed()
            ->whereIn('child_id', $childIds)
            ->pluck('id');
    }

    /**
     * Faturanın bu veliye ait olup olmadığını doğrula.
     */
    private function belongsToParent(Invoice $invoice): bool
    {
        if ($invoice->user_id === $this->user()->id) {
            return true;
        }

        if ($invoice->payable_type === ActivityClassEnrollment::class) {
            $enrollmentIds = $this->getFamilyEnrollmentIds();

            return $enrollmentIds->contains($invoice->payable_id);
        }

        return false;
    }

    private function formatInvoice(Invoice $invoice, bool $detail = false): array
    {
        $aci = $invoice->relationLoaded('activityClassInvoice') ? $invoice->activityClassInvoice : null;

        $data = [
            'id' => $invoice->id,
            'invoice_no' => $invoice->invoice_no,
            'module' => $invoice->module ?? 'subscription',
            'invoice_type' => $invoice->invoice_type ?? 'invoice',
            'original_invoice_id' => $invoice->original_invoice_id,
            'refund_reason' => $invoice->refund_reason,
            'status' => $invoice->status,
            'total_amount' => (float) $invoice->total_amount,
            'currency' => $invoice->currency,
            'notes' => $invoice->notes,
            'issue_date' => $invoice->issue_date?->format('Y-m-d'),
            'due_date' => $invoice->due_date?->format('Y-m-d'),
            'paid_at' => $invoice->paid_at?->format('Y-m-d H:i:s'),
            'is_overdue' => $invoice->isOverdue(),
            'created_at' => $invoice->created_at?->format('Y-m-d H:i:s'),
            // Etkinlik sınıfı fatura detayı
            'child' => $aci?->child ? [
                'id' => $aci->child->id,
                'full_name' => $aci->child->first_name.' '.$aci->child->last_name,
            ] : null,
            'activity_class' => $aci?->activityClass ? [
                'id' => $aci->activityClass->id,
                'name' => $aci->activityClass->name,
            ] : null,
        ];

        if ($detail) {
            $data['items'] = $invoice->relationLoaded('items')
                ? $invoice->items->map(fn ($item) => [
                    'id' => $item->id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                ])->toArray()
                : [];

            $data['transactions'] = $invoice->relationLoaded('transactions')
                ? $invoice->transactions->map(fn ($t) => [
                    'id' => $t->id,
                    'order_id' => $t->order_id,
                    'amount' => (float) $t->amount,
                    'status' => $t->status,
                    'payment_gateway' => $t->payment_gateway,
                    'bank_name' => $t->bank_name,
                    'card_last_four' => $t->card_last_four,
                    'error_message' => $t->error_message,
                    'created_at' => $t->created_at?->format('Y-m-d H:i:s'),
                ])->toArray()
                : [];

            if ($aci) {
                if ($aci->relationLoaded('activityClass') && $aci->activityClass) {
                    $data['activity_class'] = [
                        'id' => $aci->activityClass->id,
                        'name' => $aci->activityClass->name,
                        'location' => $aci->activityClass->location,
                        'schedule' => $aci->activityClass->schedule,
                        'start_date' => $aci->activityClass->start_date,
                        'end_date' => $aci->activityClass->end_date,
                    ];
                }

                if ($aci->relationLoaded('refundInvoice') && $aci->refundInvoice) {
                    $data['refund_invoice'] = [
                        'id' => $aci->refundInvoice->id,
                        'invoice_number' => $aci->refundInvoice->invoice_number,
                        'status' => $aci->refundInvoice->status,
                    ];
                }

                if ($aci->relationLoaded('originalInvoice') && $aci->originalInvoice?->exists) {
                    $data['original_invoice'] = [
                        'id' => $aci->originalInvoice->id,
                        'invoice_number' => $aci->originalInvoice->invoice_number,
                        'amount' => (float) $aci->originalInvoice->amount,
                        'currency' => $aci->originalInvoice->currency,
                        'status' => $aci->originalInvoice->status,
                    ];
                }
            }
        }

        return $data;
    }
}
