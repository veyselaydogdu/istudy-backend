<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('child_medication_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('medication_id')->nullable()->constrained('medications')->nullOnDelete();
            $table->string('custom_medication_name')->nullable();
            $table->string('dose')->nullable();
            $table->foreignId('given_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('given_at');
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('child_pickup_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('authorized_pickup_id')->nullable()->constrained('authorized_pickups')->nullOnDelete();
            $table->string('picked_by_name');
            $table->string('picked_by_photo')->nullable();
            $table->timestamp('picked_at');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('child_pickup_logs');
        Schema::dropIfExists('child_medication_logs');
    }
};
