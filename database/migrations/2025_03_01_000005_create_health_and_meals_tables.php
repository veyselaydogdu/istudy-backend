<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | Türkçe Açıklama
    |--------------------------------------------------------------------------
    | Bu dosya Sağlık ve Beslenme modüllerini içerir.
    | Allergens, Medications, Conditions: Sağlık tanımları.
    | Meals: Yemek menüleri ve içerikleri.
    | Pivotlar: Çocukların bu tanımlarla ilişkilendirilmesi.
    */

    public function up(): void
    {
        // --- TANIMLAR ---

        // 1. ALLERGENS
        Schema::create('allergens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete(); // Nullable for global commons
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('risk_level')->default('medium'); // low, medium, high

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('allergens_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 2. MEDICAL_CONDITIONS
        Schema::create('medical_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('medical_conditions_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 3. MEDICATIONS
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('usage_notes')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('medications_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 4. FOOD_INGREDIENTS
        Schema::create('food_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('allergen_info')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('food_ingredients_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 5. MEALS
        Schema::create('meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('meal_type'); // Breakfast, Lunch, Snack

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('meals_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // --- PIVOTS ---

        // MEAL_INGREDIENT_PIVOT
        Schema::create('meal_ingredient_pivot', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_id')->constrained('meals')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('food_ingredients')->cascadeOnDelete();
            $table->timestamps();
        });

        // CHILD_ALLERGENS
        Schema::create('child_allergens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('allergen_id')->constrained('allergens')->cascadeOnDelete();
            $table->timestamps();
        });

        // CHILD_MEDICATIONS
        Schema::create('child_medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('medication_id')->constrained('medications')->cascadeOnDelete();
            $table->timestamps();
        });

        // CHILD_CONDITIONS
        Schema::create('child_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('condition_id')->constrained('medical_conditions')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_conditions');
        Schema::dropIfExists('child_medications');
        Schema::dropIfExists('child_allergens');
        Schema::dropIfExists('meal_ingredient_pivot');
        Schema::dropIfExists('meals_histories');
        Schema::dropIfExists('meals');
        Schema::dropIfExists('food_ingredients_histories');
        Schema::dropIfExists('food_ingredients');
        Schema::dropIfExists('medications_histories');
        Schema::dropIfExists('medications');
        Schema::dropIfExists('medical_conditions_histories');
        Schema::dropIfExists('medical_conditions');
        Schema::dropIfExists('allergens_histories');
        Schema::dropIfExists('allergens');
    }
};
