<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * - classes tablosuna description, age_min, age_max ekleniyor
     * - activities tablosuna start_date ve end_date ekleniyor
     * - activity_class_assignments pivot tablosu oluşturuluyor
     */
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            if (! Schema::hasColumn('classes', 'description')) {
                $table->text('description')->nullable()->after('name')->comment('Sınıf açıklaması');
            }

            if (! Schema::hasColumn('classes', 'age_min')) {
                $table->tinyInteger('age_min')->nullable()->unsigned()->after('description')->comment('Minimum yaş');
            }

            if (! Schema::hasColumn('classes', 'age_max')) {
                $table->tinyInteger('age_max')->nullable()->unsigned()->after('age_min')->comment('Maksimum yaş');
            }
        });

        Schema::table('activities', function (Blueprint $table) {
            if (! Schema::hasColumn('activities', 'start_date')) {
                $table->date('start_date')->nullable()->after('description')->comment('Başlangıç tarihi');
            }

            if (! Schema::hasColumn('activities', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date')->comment('Bitiş tarihi');
            }
        });

        if (! Schema::hasTable('activity_class_assignments')) {
            Schema::create('activity_class_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
                $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['activity_id', 'class_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_class_assignments');

        // start_date / end_date on activities and description on classes are
        // managed by the enhance_system_tables migration — not dropped here.
        // Only drop the columns exclusively introduced by this migration.
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['age_min', 'age_max']);
        });
    }
};
