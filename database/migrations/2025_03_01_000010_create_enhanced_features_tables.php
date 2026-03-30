<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | Ödeme Alanları Ekleme
    | - events: fee, payment_required
    | - activities: fee, currency, payment_required
    |
    | NOT: Diğer tüm tablo değişiklikleri ve yeni tablolar
    | 2025_03_01_000010_enhance_system_tables.php içindedir.
    |--------------------------------------------------------------------------
    */

    public function up(): void
    {
        // events.currency enhance_system_tables.php tarafından ekleniyor,
        // bu nedenle burada sadece fee ve payment_required ekleniyor.
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'fee')) {
                $table->decimal('fee', 10, 2)->default(0)->after('price')
                      ->comment('Etkinlik ücreti');
            }
            if (!Schema::hasColumn('events', 'payment_required')) {
                $table->boolean('payment_required')->default(false)
                      ->comment('Ödeme gerekli mi?');
            }
        });

        Schema::table('activities', function (Blueprint $table) {
            if (!Schema::hasColumn('activities', 'fee')) {
                $table->decimal('fee', 10, 2)->default(0)->after('description')
                      ->comment('Aktivite ücreti');
            }
            if (!Schema::hasColumn('activities', 'currency')) {
                $table->string('currency', 3)->default('USD')
                      ->comment('Para birimi');
            }
            if (!Schema::hasColumn('activities', 'payment_required')) {
                $table->boolean('payment_required')->default(false)
                      ->comment('Ödeme gerekli mi?');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['fee', 'currency', 'payment_required']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['fee', 'payment_required']);
        });
    }
};
