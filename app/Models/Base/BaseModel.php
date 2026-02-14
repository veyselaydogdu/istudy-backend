<?php

namespace App\Models\Base;

use App\Models\User;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Schema;

abstract class BaseModel extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'snapshot' => 'array',
        'is_active' => 'boolean',
        'is_paid' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // 1. created_by ve updated_by otomatik doldurma
        static::creating(function ($model) {
            if (auth()->check()) {
                if (Schema::hasColumn($model->getTable(), 'created_by') && ! $model->created_by) {
                    $model->created_by = auth()->id();
                }
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                if (Schema::hasColumn($model->getTable(), 'updated_by')) {
                    $model->updated_by = auth()->id();
                }
            }
        });

        // 3. Register History Observer
        static::observe(\App\Observers\HistoryObserver::class);

        // 2. Tenant Awareness
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (auth()->check() && auth()->user()->tenant_id) {
                // Model tenant_id sütununa sahip mi?
                // Model instance üzerinden kontrol etmek için make() kullanmak gerekebilir ama
                // static bağlamdayız. getTable() ile sütun kontrolü en güvenlisi.
                // Performans için sütun listesi cachelenebilir.

                // Basit bir kontrol: fillable içinde var mı veya model property olarak tanımlı mı?
                // En garantisi Schema::hasColumn ama yavaş olabilir.
                // Genelde TenantScope trait kullanılır. Burada dinamik yapıyoruz.

                $model = new static;
                if (in_array('tenant_id', $model->getFillable()) || Schema::hasColumn($model->getTable(), 'tenant_id')) {
                    // Eğer kullanıcı tenant_owner veya altı ise kendi tenant verisini görür.
                    // Super admin hariç tutulabilir.
                    if (! auth()->user()->isSuperAdmin()) {
                        $builder->where($model->getTable().'.tenant_id', auth()->user()->tenant_id);
                    }
                }
            }
        });
    }

    /**
     * Get the user who created the record.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by')->withDefault();
    }

    /**
     * Get the user who updated the record.
     */
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by')->withDefault();
    }
}
