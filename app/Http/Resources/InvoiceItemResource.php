<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'description' => $this->description,
            'quantity'    => $this->quantity,
            'unit_price'  => (float) $this->unit_price,
            'total_price' => (float) $this->total_price,
            'discount'    => (float) $this->discount,
            'item_type'   => $this->item_type,
            'item_id'     => $this->item_id,
        ];
    }
}
