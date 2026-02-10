<?php

namespace App\Observers;

use App\Models\Base\BaseModel;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Eloquent\Model;

class HistoryObserver
{
    /**
     * Handle the Model "created" event.
     */
    public function created(Model $model): void
    {
        $this->logHistory($model, 'create');
    }

    /**
     * Handle the Model "updated" event.
     */
    public function updated(Model $model): void
    {
        $this->logHistory($model, 'update');
    }

    /**
     * Handle the Model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        $this->logHistory($model, 'delete');
    }

    protected function logHistory(Model $model, string $operation): void
    {
        // Pivot tablolar hariç tutulur (Model event tetiklemez ama yine de pivot kontrolü)
        if ($model instanceof \Illuminate\Database\Eloquent\Relations\Pivot) {
            return;
        }

        $tableName = $model->getTable();
        $historyTable = $tableName . '_histories';

        // History tablosu var mı kontrolü (Performans için cache gerekebilir ama şimdilik en güvenli yol)
        // Schema::hasTable yavaş olabilir, bunu bir config array veya cache ile yönetmek daha iyidir.
        // Ancak talep gereği her model için history observer çalışmalı.
        // History tablosu migration ile standart üretildiği için var olduğunu varsayıyoruz.

        try {
            DB::table($historyTable)->insert([
                'original_id' => $model->getKey(),
                'operation_type' => $operation,
                'snapshot' => $model->toJson(),
                'operated_by' => auth()->id(), // Auth user ID or null
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // History tablosu yoksa veya hata oluşursa loga yaz, işlemi durdurma
            logger()->error("History log failed for table {$tableName}: " . $e->getMessage());
        }
    }
}
