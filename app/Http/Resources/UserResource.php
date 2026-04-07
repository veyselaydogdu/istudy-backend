<?php

namespace App\Http\Resources;

use App\Models\Tenant\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'name' => $this->name,
            'surname' => $this->surname,
            'email' => $this->email,
            'phone' => $this->phone,
            'locale' => $this->locale,
            'tenant_id' => $this->tenant_id,
            'has_active_subscription' => $this->tenant_id
                ? Tenant::find($this->tenant_id)?->hasActiveSubscription() ?? false
                : false,
            'last_login_at' => $this->last_login_at?->toISOString(),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
