<?php

namespace App\Jobs;

use App\Models\Base\ActivityLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Asenkron Activity Log Yazma
 *
 * Performans-kritik işlemlerde ana iş parçacığını bloklamadan
 * log kaydını queue üzerinden yazar.
 *
 * config/audit.php → async = true olduğunda kullanılır.
 */
class WriteActivityLog implements ShouldQueue
{
    use Queueable;

    /**
     * Kaç kez denenecek
     */
    public int $tries = 3;

    /**
     * Deneme arası bekleme (saniye)
     */
    public int $backoff = 5;

    public function __construct(
        protected array $logData
    ) {
        // audit kuyruğunu kullan
        $this->onQueue(config('audit.queue.name', 'audit'));

        if ($connection = config('audit.queue.connection')) {
            $this->onConnection($connection);
        }
    }

    public function handle(): void
    {
        ActivityLog::create($this->logData);
    }

    /**
     * Job başarısız olursa
     */
    public function failed(\Throwable $exception): void
    {
        logger()->error('Activity log yazma başarısız: ' . $exception->getMessage(), [
            'data' => $this->logData,
        ]);
    }
}
