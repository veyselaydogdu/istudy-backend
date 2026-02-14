<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CountryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'official_name'   => $this->official_name,
            'native_name'     => $this->native_name,
            'iso2'            => $this->iso2,
            'iso3'            => $this->iso3,
            'numeric_code'    => $this->numeric_code,
            'phone'           => [
                'code'     => $this->phone_code,
                'root'     => $this->phone_root,
                'suffixes' => $this->phone_suffixes,
            ],
            'currency'        => [
                'code'   => $this->currency_code,
                'name'   => $this->currency_name,
                'symbol' => $this->currency_symbol,
            ],
            'geography'       => [
                'region'     => $this->region,
                'subregion'  => $this->subregion,
                'capital'    => $this->capital,
                'continents' => $this->continents,
                'timezones'  => $this->timezones,
                'latitude'   => $this->latitude,
                'longitude'  => $this->longitude,
            ],
            'languages'       => $this->languages,
            'flags'           => [
                'emoji' => $this->flag_emoji,
                'png'   => $this->flag_png,
                'svg'   => $this->flag_svg,
            ],
            'population'      => $this->population,
            'is_active'       => $this->is_active,
            'sort_order'      => $this->sort_order,
            'extra_data'      => $this->when($request->routeIs('admin.*'), $this->extra_data),
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
        ];
    }
}
