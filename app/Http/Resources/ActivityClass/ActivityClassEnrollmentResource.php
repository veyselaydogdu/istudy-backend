<?php

namespace App\Http\Resources\ActivityClass;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityClassEnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'activity_class_id' => $this->activity_class_id,
            'child_id' => $this->child_id,
            'status' => $this->status,
            'enrolled_by' => $this->enrolled_by,
            'enrolled_at' => $this->enrolled_at,
            'notes' => $this->notes,
            'child' => $this->whenLoaded('child', fn () => $this->child ? [
                'id' => $this->child->id,
                'full_name' => $this->child->full_name,
                'birth_date' => $this->child->birth_date?->format('Y-m-d'),
            ] : null),
            'invoice' => $this->whenLoaded('invoice', fn () => $this->invoice ? [
                'id' => $this->invoice->id,
                'invoice_number' => $this->invoice->invoice_number,
                'amount' => $this->invoice->amount,
                'currency' => $this->invoice->currency,
                'status' => $this->invoice->status,
                'due_date' => $this->invoice->due_date?->format('Y-m-d'),
                'payment_required' => $this->invoice->payment_required,
                'paid_at' => $this->invoice->paid_at,
            ] : null),
            'created_at' => $this->created_at,
        ];
    }
}
