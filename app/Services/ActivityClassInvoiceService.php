<?php

namespace App\Services;

use App\Models\ActivityClass\ActivityClass;
use App\Models\ActivityClass\ActivityClassEnrollment;
use App\Models\ActivityClass\ActivityClassInvoice;
use App\Models\Billing\Invoice;
use Illuminate\Support\Facades\Auth;

class ActivityClassInvoiceService
{
    /**
     * Etkinlik sınıfı kaydı için hem ActivityClassInvoice hem de ana Invoice oluştur.
     * Bu metot tüm enrollment (hem tenant hem veli) akışlarında kullanılır.
     */
    public function createForEnrollment(
        ActivityClassEnrollment $enrollment,
        ActivityClass $activityClass,
        ?int $createdByUserId = null,
        ?string $dueDate = null,
        bool $paymentRequired = true
    ): ActivityClassInvoice {
        $createdByUserId ??= Auth::id();
        $invoiceNumber = 'INV-AC-'.strtoupper(substr(uniqid(), -8));

        // Ana Invoice kaydı oluştur (birleşik faturalandırma için)
        $mainInvoice = Invoice::withoutGlobalScope('tenant')->create([
            'invoice_no' => Invoice::generateInvoiceNo(),
            'tenant_id' => $activityClass->tenant_id,
            'user_id' => $enrollment->enrolled_by_user_id ?? $createdByUserId,
            'school_id' => $activityClass->school_id,
            'type' => 'activity_class',
            'module' => 'activity_class',
            'invoice_type' => 'invoice',
            'status' => 'pending',
            'subtotal' => $activityClass->price,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => $activityClass->price,
            'currency' => $activityClass->currency,
            'issue_date' => now()->toDateString(),
            'due_date' => $dueDate ?? now()->addDays(7)->toDateString(),
            'payable_type' => ActivityClassEnrollment::class,
            'payable_id' => $enrollment->id,
            'notes' => "Etkinlik Sınıfı: {$activityClass->name}",
            'created_by' => $createdByUserId,
        ]);

        // Fatura kalemi ekle
        $mainInvoice->items()->create([
            'description' => $activityClass->name,
            'quantity' => 1,
            'unit_price' => $activityClass->price,
            'total_price' => $activityClass->price,
            'item_type' => 'activity_class',
            'item_id' => $activityClass->id,
        ]);

        // Modüle özgü ActivityClassInvoice oluştur
        return ActivityClassInvoice::create([
            'main_invoice_id' => $mainInvoice->id,
            'activity_class_enrollment_id' => $enrollment->id,
            'activity_class_id' => $activityClass->id,
            'child_id' => $enrollment->child_id,
            'family_profile_id' => $enrollment->family_profile_id,
            'invoice_number' => $invoiceNumber,
            'invoice_type' => 'invoice',
            'amount' => $activityClass->price,
            'currency' => $activityClass->currency,
            'status' => 'pending',
            'payment_required' => $paymentRequired,
            'due_date' => $dueDate ?? now()->addDays(7)->toDateString(),
            'created_by' => $createdByUserId,
        ]);
    }

    /**
     * Ödenmis bir fatura için iade (credit note) faturası oluşturur.
     * Hem ActivityClassInvoice hem ana Invoice kaydı güncellenir/oluşturulur.
     */
    public function createRefund(ActivityClassInvoice $original, ?string $reason = null): ActivityClassInvoice
    {
        $refundNumber = 'REF-AC-'.strtoupper(substr(uniqid(), -8));

        // Ana invoice iadesi
        $mainRefundInvoice = null;
        if ($original->main_invoice_id) {
            $originalMainInvoice = Invoice::withoutGlobalScope('tenant')->find($original->main_invoice_id);
            if ($originalMainInvoice) {
                $mainRefundInvoice = Invoice::withoutGlobalScope('tenant')->create([
                    'invoice_no' => Invoice::generateInvoiceNo(),
                    'tenant_id' => $originalMainInvoice->tenant_id,
                    'user_id' => $originalMainInvoice->user_id,
                    'school_id' => $originalMainInvoice->school_id,
                    'type' => 'activity_class',
                    'module' => 'activity_class',
                    'invoice_type' => 'refund',
                    'original_invoice_id' => $originalMainInvoice->id,
                    'refund_reason' => $reason,
                    'status' => 'paid',
                    'subtotal' => $originalMainInvoice->subtotal,
                    'tax_rate' => $originalMainInvoice->tax_rate,
                    'tax_amount' => $originalMainInvoice->tax_amount,
                    'discount_amount' => 0,
                    'total_amount' => $originalMainInvoice->total_amount,
                    'currency' => $originalMainInvoice->currency,
                    'issue_date' => now()->toDateString(),
                    'paid_at' => now(),
                    'payable_type' => $originalMainInvoice->payable_type,
                    'payable_id' => $originalMainInvoice->payable_id,
                    'notes' => 'İade faturası — orijinal: '.$originalMainInvoice->invoice_no,
                    'created_by' => Auth::id(),
                ]);

                $originalMainInvoice->update(['status' => 'refunded']);
            }
        }

        $refund = ActivityClassInvoice::create([
            'main_invoice_id' => $mainRefundInvoice?->id,
            'activity_class_enrollment_id' => $original->activity_class_enrollment_id,
            'activity_class_id' => $original->activity_class_id,
            'child_id' => $original->child_id,
            'family_profile_id' => $original->family_profile_id,
            'invoice_number' => $refundNumber,
            'invoice_type' => 'refund',
            'original_invoice_id' => $original->id,
            'refund_reason' => $reason,
            'amount' => $original->amount,
            'currency' => $original->currency,
            'status' => 'paid',
            'payment_required' => false,
            'notes' => 'İade faturası — orijinal: '.$original->invoice_number,
            'created_by' => Auth::id(),
        ]);

        $original->update(['status' => 'refunded']);

        return $refund;
    }

    /**
     * Kayıt iptalinde ilgili aktif faturayı bul ve ödenmişse iade oluştur.
     *
     * @return array{refunded: bool, refund: ActivityClassInvoice|null}
     */
    public function handleEnrollmentCancellation(int $enrollmentId, ?string $reason = null): array
    {
        $invoice = ActivityClassInvoice::where('activity_class_enrollment_id', $enrollmentId)
            ->where('invoice_type', 'invoice')
            ->whereIn('status', ['pending', 'paid', 'overdue'])
            ->latest()
            ->first();

        if (! $invoice) {
            return ['refunded' => false, 'refund' => null];
        }

        if ($invoice->isPaid()) {
            $refund = $this->createRefund($invoice, $reason);

            return ['refunded' => true, 'refund' => $refund];
        }

        // pending veya overdue → sadece iptal et
        $invoice->update(['status' => 'cancelled']);

        if ($invoice->main_invoice_id) {
            Invoice::withoutGlobalScope('tenant')
                ->where('id', $invoice->main_invoice_id)
                ->update(['status' => 'cancelled']);
        }

        return ['refunded' => false, 'refund' => null];
    }
}
