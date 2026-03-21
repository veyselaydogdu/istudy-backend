<?php

namespace App\Http\Resources\ActivityClass;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityClassInvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'payment_required' => $this->payment_required,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'paid_at' => $this->paid_at,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'child' => $this->whenLoaded('child', fn () => $this->child ? [
                'id' => $this->child->id,
                'full_name' => $this->child->full_name,
            ] : null),
            'family_profile' => $this->whenLoaded('familyProfile', fn () => $this->familyProfile && $this->familyProfile->id ? [
                'id' => $this->familyProfile->id,
                'owner' => $this->familyProfile->relationLoaded('owner') && $this->familyProfile->owner ? [
                    'id' => $this->familyProfile->owner->id,
                    'name' => $this->familyProfile->owner->name.' '.$this->familyProfile->owner->surname,
                ] : null,
            ] : null),
        ];
    }
}
