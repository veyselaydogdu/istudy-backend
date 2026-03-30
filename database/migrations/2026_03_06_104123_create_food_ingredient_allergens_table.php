<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Besin öğesi ↔ allerjen pivot tablosu.
     * Tablo zaten 2025 migrasyonunda (enhance_system_tables) oluşturulmuşsa atlanır.
     */
    public function up(): void
    {
        if (Schema::hasTable('food_ingredient_allergens')) {
            return;
        }

        Schema::create('food_ingredient_allergens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')
                ->constrained('food_ingredients')
                ->cascadeOnDelete();
            $table->foreignId('allergen_id')
                ->constrained('allergens')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['ingredient_id', 'allergen_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_ingredient_allergens');
    }
};
