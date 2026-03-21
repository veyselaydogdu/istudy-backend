<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'type' => $this->type,
            'module' => $this->module ?? 'subscription',
            'invoice_type' => $this->invoice_type ?? 'invoice',
            'original_invoice_id' => $this->original_invoice_id,
            'refund_reason' => $this->refund_reason,
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'tax_rate' => (float) $this->tax_rate,
            'tax_amount' => (float) $this->tax_amount,
            'discount_amount' => (float) $this->discount_amount,
            'total_amount' => (float) $this->total_amount,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'issue_date' => $this->issue_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'paid_at' => $this->paid_at?->format('Y-m-d H:i:s'),
            'is_overdue' => $this->isOverdue(),

            // İlişkiler
            'user' => $this->whenLoaded('user', fn () => $this->user?->id ? [
                'id' => $this->user->id,
                'name' => $this->user->name.' '.($this->user->surname ?? ''),
                'email' => $this->user->email,
            ] : null),
            'tenant' => $this->whenLoaded('tenant', fn () => $this->tenant?->id ? [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
            ] : null),
            'school' => $this->whenLoaded('school', fn () => $this->school?->id ? [
                'id' => $this->school->id,
                'name' => $this->school->name,
            ] : null),

            // Etkinlik sınıfı detayı (module=activity_class ise)
            'activity_class_invoice' => $this->whenLoaded('activityClassInvoice', fn () => $this->activityClassInvoice?->id ? [
                'id' => $this->activityClassInvoice->id,
                'invoice_number' => $this->activityClassInvoice->invoice_number,
                'child' => $this->activityClassInvoice->relationLoaded('child') && $this->activityClassInvoice->child ? [
                    'id' => $this->activityClassInvoice->child->id,
                    'full_name' => $this->activityClassInvoice->child->full_name,
                ] : null,
            ] : null),

            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'transactions' => TransactionResource::collection($this->whenLoaded('transactions')),
            'transactions_count' => $this->whenCounted('transactions'),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
