<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,

            // Kullanıcı (denormalize — JOIN gerektirmez)
            'user' => [
                'id'    => $this->user_id,
                'name'  => $this->user_name,
                'email' => $this->user_email,
            ],

            // Etkilenen kayıt
            'model' => [
                'type'  => $this->model_type,
                'label' => $this->model_label,
                'id'    => $this->model_id,
            ],

            // İşlem
            'action'       => $this->action,
            'action_label' => $this->action_label,
            'description'  => $this->description,

            // Değişiklikler
            'changes' => [
                'old_values'     => $this->old_values,
                'new_values'     => $this->new_values,
                'changed_fields' => $this->changed_fields,
            ],

            // Bağlam
            'context' => [
                'tenant_id'  => $this->tenant_id,
                'school_id'  => $this->school_id,
                'ip_address' => $this->ip_address,
                'method'     => $this->method,
                'url'        => $this->url,
            ],

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'time_ago'   => $this->created_at?->diffForHumans(),
        ];
    }
}
