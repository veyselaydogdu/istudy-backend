<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurrencyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'code'                => $this->code,
            'name'                => $this->name,
            'name_tr'             => $this->name_tr,
            'symbol'              => $this->symbol,
            'symbol_position'     => $this->symbol_position,
            'thousands_separator' => $this->thousands_separator,
            'decimal_separator'   => $this->decimal_separator,
            'decimal_places'      => $this->decimal_places,
            'is_active'           => $this->is_active,
            'is_base'             => $this->is_base,
            'sort_order'          => $this->sort_order,

            // En güncel kur
            'current_rate' => $this->whenLoaded('latestRate', fn () => [
                'rate'      => (float) ($this->latestRate->rate ?? 0),
                'buy_rate'  => $this->latestRate->buy_rate ? (float) $this->latestRate->buy_rate : null,
                'sell_rate' => $this->latestRate->sell_rate ? (float) $this->latestRate->sell_rate : null,
                'rate_date' => $this->latestRate->rate_date?->format('Y-m-d'),
                'source'    => $this->latestRate->source ?? null,
            ]),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
