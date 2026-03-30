<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'order_id'               => $this->order_id,
            'amount'                 => (float) $this->amount,
            'currency'               => $this->currency,
            'status'                 => $this->status,
            'status_label'           => $this->status_label,
            'payment_gateway'        => $this->payment_gateway,
            'bank_name'              => $this->bank_name,
            'card_last_four'         => $this->card_last_four,
            'card_type'              => $this->card_type,
            'installment'            => $this->installment,
            'gateway_transaction_id' => $this->gateway_transaction_id,
            'error_message'          => $this->error_message,
            'error_code'             => $this->error_code,
            'ip_address'             => $this->ip_address,
            'completed_at'           => $this->completed_at?->format('Y-m-d H:i:s'),

            // İlişkiler
            'invoice' => $this->whenLoaded('invoice', fn () => [
                'id'         => $this->invoice->id,
                'invoice_no' => $this->invoice->invoice_no,
                'status'     => $this->invoice->status,
                'total_amount' => (float) $this->invoice->total_amount,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ]),
            'school' => $this->whenLoaded('school', fn () => [
                'id'   => $this->school->id,
                'name' => $this->school->name,
            ]),
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id'   => $this->tenant->id,
                'name' => $this->tenant->name,
            ]),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
