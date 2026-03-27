<?php

namespace App\Services;

use App\Models\Activity\Activity;
use App\Models\Activity\ActivityEnrollment;
use App\Models\Billing\Invoice;
use Illuminate\Support\Facades\Auth;

/**
 * Etkinlik kayıt faturalarını yönetir.
 *
 * Pattern: ActivityClassInvoiceService ile aynı yapı.
 * Faturalar doğrudan ana invoices tablosuna yazılır; payable = ActivityEnrollment.
 */
class ActivityInvoiceService
{
    /**
     * Etkinlik kaydı için fatura oluştur ve enrollment.invoice_id güncelle.
     */
    public function createForEnrollment(
        ActivityEnrollment $enrollment,
        Activity $activity,
        ?int $createdByUserId = null
    ): Invoice {
        $createdByUserId ??= Auth::id();

        /** @var \App\Models\School\School $school */
        $school = $activity->school ?? $activity->load('school')->school;

        $invoice = Invoice::withoutGlobalScope('tenant')->create([
            'invoice_no' => Invoice::generateInvoiceNo(),
            'tenant_id' => $school->tenant_id,
            'user_id' => $enrollment->enrolled_by_user_id ?? $createdByUserId,
            'school_id' => $activity->school_id,
            'type' => 'activity',
            'module' => 'activity',
            'invoice_type' => 'invoice',
            'status' => 'pending',
            'subtotal' => $activity->price,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => $activity->price,
            'currency' => 'TRY',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'payable_type' => ActivityEnrollment::class,
            'payable_id' => $enrollment->id,
            'notes' => "Etkinlik Kaydı: {$activity->name}",
            'created_by' => $createdByUserId,
        ]);

        $invoice->items()->create([
            'description' => $activity->name,
            'quantity' => 1,
            'unit_price' => $activity->price,
            'total_price' => $activity->price,
            'item_type' => 'activity',
            'item_id' => $activity->id,
        ]);

        // enrollment kaydına invoice_id bağla
        $enrollment->update(['invoice_id' => $invoice->id]);

        return $invoice->fresh(['items']);
    }

    /**
     * Ödeme yapılmış bir fatura için iade faturası oluştur.
     */
    public function createRefund(Invoice $original, ?string $reason = null): Invoice
    {
        $refund = Invoice::withoutGlobalScope('tenant')->create([
            'invoice_no' => Invoice::generateInvoiceNo(),
            'tenant_id' => $original->tenant_id,
            'user_id' => $original->user_id,
            'school_id' => $original->school_id,
            'type' => 'activity',
            'module' => 'activity',
            'invoice_type' => 'refund',
            'original_invoice_id' => $original->id,
            'refund_reason' => $reason,
            'status' => 'paid',
            'subtotal' => $original->subtotal,
            'tax_rate' => $original->tax_rate,
            'tax_amount' => $original->tax_amount,
            'discount_amount' => 0,
            'total_amount' => $original->total_amount,
            'currency' => $original->currency,
            'issue_date' => now()->toDateString(),
            'paid_at' => now(),
            'payable_type' => $original->payable_type,
            'payable_id' => $original->payable_id,
            'notes' => "İade faturası — orijinal: {$original->invoice_no}",
            'created_by' => Auth::id(),
        ]);

        $refund->items()->create([
            'description' => "İade — {$original->items()->first()?->description}",
            'quantity' => 1,
            'unit_price' => $original->total_amount,
            'total_price' => $original->total_amount,
            'item_type' => 'activity',
            'item_id' => $original->items()->first()?->item_id,
        ]);

        $original->update(['status' => 'refunded']);

        return $refund->fresh(['items']);
    }

    /**
     * Kayıt iptalinde ilgili faturayı işle:
     * - paid     → iade faturası oluştur
     * - pending / overdue → iptal et
     *
     * @return array{refunded: bool, invoice: Invoice|null}
     */
    public function handleEnrollmentCancellation(ActivityEnrollment $enrollment, ?string $reason = null): array
    {
        if (! $enrollment->invoice_id) {
            return ['refunded' => false, 'invoice' => null];
        }

        $invoice = Invoice::withoutGlobalScope('tenant')->find($enrollment->invoice_id);

        if (! $invoice || $invoice->status === 'cancelled' || $invoice->status === 'refunded') {
            return ['refunded' => false, 'invoice' => null];
        }

        if ($invoice->status === 'paid') {
            $refund = $this->createRefund($invoice, $reason ?? 'Kayıt iptali');

            return ['refunded' => true, 'invoice' => $refund];
        }

        // pending veya overdue → iptal
        $invoice->update(['status' => 'cancelled']);

        return ['refunded' => false, 'invoice' => $invoice];
    }

    /**
     * Ücretli etkinlik ücretsize çevrildiğinde tüm aktif faturaları işle:
     * - paid     → iade
     * - pending / overdue → iptal
     *
     * @return array{refunded_count: int, cancelled_count: int}
     */
    public function handleActivityPaidToFree(Activity $activity): array
    {
        $refunded = 0;
        $cancelled = 0;

        $enrollments = ActivityEnrollment::where('activity_id', $activity->id)
            ->whereNotNull('invoice_id')
            ->get();

        foreach ($enrollments as $enrollment) {
            $result = $this->handleEnrollmentCancellation($enrollment, 'Etkinlik ücretsiz hale getirildi');

            if ($result['refunded']) {
                $refunded++;
            } elseif ($result['invoice']) {
                $cancelled++;
            }
        }

        return ['refunded_count' => $refunded, 'cancelled_count' => $cancelled];
    }
}
