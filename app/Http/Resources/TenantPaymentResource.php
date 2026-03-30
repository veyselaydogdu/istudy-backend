<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_subscription_id' => $this->tenant_subscription_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'payment_gateway' => $this->payment_gateway,
            'transaction_id' => $this->transaction_id,
            'status' => $this->status,
            'status_label' => match ($this->status) {
                'pending' => 'Bekliyor',
                'completed' => 'Tamamlandı',
                'failed' => 'Başarısız',
                'refunded' => 'İade Edildi',
                default => $this->status,
            },
            'paid_at' => $this->paid_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
