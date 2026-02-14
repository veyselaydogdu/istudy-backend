<?php

namespace App\Console\Commands;

use App\Services\ActivityLogService;
use Illuminate\Console\Command;

/**
 * Activity Log Bakım Komutu
 *
 * Eski logları arşivler, özet tablosunu günceller, arşivi temizler.
 *
 * Kullanım:
 *   php artisan audit:maintain
 *   php artisan audit:maintain --archive-only
 *   php artisan audit:maintain --summary-only
 *   php artisan audit:maintain --clean-archive --archive-days=730
 *
 * Cron (routes/console.php):
 *   Schedule::command('audit:maintain')->dailyAt('03:00');
 */
class MaintainActivityLogs extends Command
{
    protected $signature = 'audit:maintain
                            {--archive-only : Sadece arşivleme yap}
                            {--summary-only : Sadece özet tablosunu güncelle}
                            {--clean-archive : Eski arşivleri de temizle}
                            {--archive-days=730 : Arşivlerin saklanma süresi (gün)}';

    protected $description = 'Activity loglarını arşivle, özetlerini güncelle ve bakım yap';

    public function __construct(
        protected ActivityLogService $logService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $archiveOnly = $this->option('archive-only');
        $summaryOnly = $this->option('summary-only');

        $this->info('🔧 Activity Log bakım işlemi başlatılıyor...');
        $this->newLine();

        // 1. Özet tablosunu güncelle
        if (! $archiveOnly) {
            $this->info('📊 Günlük özet tablosu güncelleniyor...');
            $this->logService->updateDailySummaries();
            $this->info('   ✅ Özet tablo güncellendi.');
            $this->newLine();
        }

        // 2. Eski logları arşivle
        if (! $summaryOnly) {
            $retentionDays = config('audit.retention_days', 365);
            $this->info("📦 {$retentionDays} günden eski loglar arşivleniyor...");

            $result = $this->logService->archiveOldLogs();

            if ($result['success']) {
                $this->info("   ✅ {$result['archived']} log arşivlendi, {$result['deleted']} log silindi.");
                $this->info("   📅 Eşik tarihi: {$result['cutoff']}");
            } else {
                $this->error("   ❌ Arşivleme hatası: {$result['error']}");
            }
            $this->newLine();
        }

        // 3. Eski arşivleri temizle (opsiyonel)
        if ($this->option('clean-archive')) {
            $archiveDays = (int) $this->option('archive-days');
            $this->info("🗑️  {$archiveDays} günden eski arşivler temizleniyor...");

            $deleted = $this->logService->cleanArchive($archiveDays);
            $this->info("   ✅ {$deleted} eski arşiv kaydı silindi.");
            $this->newLine();
        }

        $this->info('✅ Bakım işlemi tamamlandı.');

        return self::SUCCESS;
    }
}
