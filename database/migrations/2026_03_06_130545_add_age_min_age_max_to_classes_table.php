<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * classes tablosuna age_min ve age_max sütunları ekleniyor.
     * 2026_02_24_120000 migration'ı kayıtlı sayılmış ancak ALTER TABLE çalışmamıştı.
     */
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            if (! Schema::hasColumn('classes', 'age_min')) {
                $table->tinyInteger('age_min')->nullable()->unsigned()->after('description');
            }
            if (! Schema::hasColumn('classes', 'age_max')) {
                $table->tinyInteger('age_max')->nullable()->unsigned()->after('age_min');
            }
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['age_min', 'age_max']);
        });
    }
};
