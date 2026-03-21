<?php

namespace App\Services;

use App\Models\ActivityClass\ActivityClassInvoice;
use Illuminate\Support\Facades\Auth;

class ActivityClassInvoiceService
{
    /**
     * Ödenmis bir fatura için iade (credit note) faturası oluşturur.
     */
    public function createRefund(ActivityClassInvoice $original, ?string $reason = null): ActivityClassInvoice
    {
        $refundNumber = 'REF-AC-'.strtoupper(substr(uniqid(), -8));

        $refund = ActivityClassInvoice::create([
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
            'notes' => 'İade faturası — orijinal fatura: '.$original->invoice_number,
            'created_by' => Auth::id(),
        ]);

        $original->update(['status' => 'refunded']);

        return $refund;
    }

    /**
     * Kayıt iptalinde ilgili aktif faturayı bul ve ödenmişse iade oluştur.
     * pending/overdue faturayı iptal et.
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

        return ['refunded' => false, 'refund' => null];
    }
}
