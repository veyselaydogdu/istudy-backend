<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_class_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_class_id')->constrained('activity_classes')->cascadeOnDelete();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->string('role')->nullable()->comment('Örn: Baş öğretmen, Asistan');
            $table->timestamps();

            $table->unique(['activity_class_id', 'teacher_profile_id'], 'act_unique');
        });

        Schema::create('activity_class_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_class_id')->constrained('activity_classes')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('quantity')->nullable();
            $table->boolean('is_required')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('activity_class_gallery', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_class_id')->constrained('activity_classes')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('caption')->nullable();
            $table->integer('sort_order')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('activity_class_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_class_enrollment_id')->constrained('activity_class_enrollments')->cascadeOnDelete();
            $table->foreignId('activity_class_id')->constrained('activity_classes')->cascadeOnDelete();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('family_profile_id')->nullable()->constrained('family_profiles')->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('TRY');
            $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled'])->default('pending');
            $table->boolean('payment_required')->default(false)->comment('true = zorunlu ödeme');
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_class_invoices');
        Schema::dropIfExists('activity_class_gallery');
        Schema::dropIfExists('activity_class_materials');
        Schema::dropIfExists('activity_class_teachers');
    }
};
