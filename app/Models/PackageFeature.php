<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackageFeature extends Model
{
    protected $fillable = [
        'key',
        'value_type',
        'label',
        'description',
        'display_order',
    ];

    protected $casts = [
        'value_type' => 'string',
    ];

    /**
     * Packages that have this feature
     */
    public function packages()
    {
        return $this->belongsToMany(Package::class, 'package_feature_pivot')
            ->withPivot('value')
            ->withTimestamps();
    }
}
