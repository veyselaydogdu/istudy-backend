<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'owner_user_id' => $this->owner_user_id,
            'country' => $this->country,
            'currency' => $this->currency,
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ]),
            'schools_count' => $this->whenCounted('schools'),
            'subscription' => $this->whenLoaded('activeSubscription', fn () => $this->activeSubscription ? [
                'id' => $this->activeSubscription->id,
                'status' => $this->activeSubscription->status,
                'package' => $this->activeSubscription->package ? [
                    'id' => $this->activeSubscription->package->id,
                    'name' => $this->activeSubscription->package->name,
                ] : null,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
