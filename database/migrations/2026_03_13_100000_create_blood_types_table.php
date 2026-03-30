<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blood_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 20)->unique(); // A+, A-, B+, B-, AB+, AB-, O+, O-
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // Standart kan gruplarını ekle
        $bloodTypes = [
            ['name' => 'A+', 'sort_order' => 8],
            ['name' => 'A-', 'sort_order' => 7],
            ['name' => 'B+', 'sort_order' => 6],
            ['name' => 'B-', 'sort_order' => 5],
            ['name' => 'AB+', 'sort_order' => 4],
            ['name' => 'AB-', 'sort_order' => 3],
            ['name' => 'O+', 'sort_order' => 2],
            ['name' => 'O-', 'sort_order' => 1],
        ];

        foreach ($bloodTypes as $bt) {
            DB::table('blood_types')->insert([
                'name' => $bt['name'],
                'sort_order' => $bt['sort_order'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blood_types');
    }
};
