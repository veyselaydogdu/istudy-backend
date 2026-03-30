<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Zamanlanmış Görevler (Scheduled Tasks)
|--------------------------------------------------------------------------
*/

// Döviz kurlarını otomatik güncelle
if (config('currency.auto_update.enabled', true)) {
    $frequency = config('currency.auto_update.frequency', 'daily');
    $time      = config('currency.auto_update.time', '09:00');

    $schedule = Schedule::command('currency:update-rates');

    match ($frequency) {
        'hourly'     => $schedule->hourly(),
        'twicedaily' => $schedule->twiceDailyAt(9, 18),
        default      => $schedule->dailyAt($time),
    };
}

// Activity log bakım işlemi (arşivleme + özet güncelleme)
Schedule::command('audit:maintain')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/audit-maintain.log'));

