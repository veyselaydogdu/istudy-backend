<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'invoice_no'      => $this->invoice_no,
            'type'            => $this->type,
            'status'          => $this->status,
            'subtotal'        => (float) $this->subtotal,
            'tax_rate'        => (float) $this->tax_rate,
            'tax_amount'      => (float) $this->tax_amount,
            'discount_amount' => (float) $this->discount_amount,
            'total_amount'    => (float) $this->total_amount,
            'currency'        => $this->currency,
            'notes'           => $this->notes,
            'issue_date'      => $this->issue_date?->format('Y-m-d'),
            'due_date'        => $this->due_date?->format('Y-m-d'),
            'paid_at'         => $this->paid_at?->format('Y-m-d H:i:s'),
            'is_overdue'      => $this->isOverdue(),

            // İlişkiler
            'user'   => $this->whenLoaded('user', fn () => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ]),
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id'   => $this->tenant->id,
                'name' => $this->tenant->name,
            ]),
            'school' => $this->whenLoaded('school', fn () => [
                'id'   => $this->school->id,
                'name' => $this->school->name,
            ]),

            'items'             => InvoiceItemResource::collection($this->whenLoaded('items')),
            'transactions'      => TransactionResource::collection($this->whenLoaded('transactions')),
            'transactions_count' => $this->whenCounted('transactions'),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
