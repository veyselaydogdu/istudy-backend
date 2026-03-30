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
        // Özellik tanımları tablosu
        Schema::create('package_features', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // Örn: "unlimited_students", "support_24_7"
            $table->enum('value_type', ['bool', 'text'])->default('bool');
            $table->string('label'); // Türkçe gösterim adı
            $table->string('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // Paket-Özellik pivot tablosu
        Schema::create('package_feature_pivot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('packages')->onDelete('cascade');
            $table->foreignId('package_feature_id')->constrained('package_features')->onDelete('cascade');
            $table->text('value')->nullable(); // bool için "1"/"0", text için özel metin
            $table->timestamps();

            $table->unique(['package_id', 'package_feature_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_feature_pivot');
        Schema::dropIfExists('package_features');
    }
};
