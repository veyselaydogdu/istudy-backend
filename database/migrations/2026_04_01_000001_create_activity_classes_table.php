<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('language', 10)->default('tr');
            $table->tinyInteger('age_min')->nullable();
            $table->tinyInteger('age_max')->nullable();
            $table->integer('capacity')->nullable();
            $table->boolean('is_school_wide')->default(true)->comment('true = tüm okula açık, false = belirli sınıflara');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_paid')->default(false);
            $table->decimal('price', 10, 2)->nullable();
            $table->string('currency', 3)->default('TRY');
            $table->boolean('invoice_required')->default(false)->comment('true = ödeme zorunlu, false = sonra ödenebilir');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('schedule')->nullable()->comment('Örn: Pazartesi 14:00-15:00');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('activity_class_school_class_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('activity_class_id');
            $table->unsignedBigInteger('school_class_id');
            $table->timestamps();

            $table->foreign('activity_class_id', 'acsc_activity_class_fk')->references('id')->on('activity_classes')->cascadeOnDelete();
            $table->foreign('school_class_id', 'acsc_school_class_fk')->references('id')->on('classes')->cascadeOnDelete();
            $table->unique(['activity_class_id', 'school_class_id'], 'acsc_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_class_school_class_assignments');
        Schema::dropIfExists('activity_classes');
    }
};
