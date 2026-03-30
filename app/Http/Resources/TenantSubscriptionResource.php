<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantSubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'package' => PackageResource::make($this->whenLoaded('package')),
            'billing_cycle' => $this->billing_cycle,
            'billing_cycle_label' => $this->billing_cycle === 'yearly' ? 'Yıllık' : 'Aylık',
            'price' => $this->price,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'auto_renew' => $this->auto_renew,
            'is_active' => $this->when(true, fn () => $this->isActive()),
            'payments' => TenantPaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    protected function statusLabel(): string
    {
        return match ($this->status) {
            'trial' => 'Deneme',
            'active' => 'Aktif',
            'cancelled' => 'İptal Edildi',
            'expired' => 'Süresi Doldu',
            'suspended' => 'Askıya Alındı',
            default => $this->status,
        };
    }
}
