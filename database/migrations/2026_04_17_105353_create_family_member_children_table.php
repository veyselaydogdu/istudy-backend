<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_member_children', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_member_id')->constrained('family_members')->cascadeOnDelete();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['family_member_id', 'child_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_member_children');
    }
};
