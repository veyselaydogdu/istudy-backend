<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. children tablosuna yeni alanlar ekle
        Schema::table('children', function (Blueprint $table) {
            if (! Schema::hasColumn('children', 'identity_number')) {
                $table->string('identity_number', 50)->nullable()->after('special_notes');
            }

            if (! Schema::hasColumn('children', 'nationality_country_id')) {
                $table->foreignId('nationality_country_id')->nullable()->after('identity_number')->constrained('countries')->nullOnDelete();
            }

            if (! Schema::hasColumn('children', 'languages')) {
                $table->json('languages')->nullable()->after('nationality_country_id');
            }

            if (! Schema::hasColumn('children', 'parent_notes')) {
                $table->text('parent_notes')->nullable()->after('languages');
            }
        });

        // 2. child_medications pivot tablosuna ekle + medication_id nullable yap
        Schema::table('child_medications', function (Blueprint $table) {
            // medication_id nullable yap (custom ilaçlar için)
            if (Schema::hasColumn('child_medications', 'medication_id')) {
                $table->unsignedBigInteger('medication_id')->nullable()->change();
            }

            if (! Schema::hasColumn('child_medications', 'custom_name')) {
                $table->string('custom_name', 150)->nullable()->after('medication_id');
            }

            if (! Schema::hasColumn('child_medications', 'dose')) {
                $table->string('dose', 100)->nullable()->after('custom_name');
            }

            if (! Schema::hasColumn('child_medications', 'usage_time')) {
                $table->json('usage_time')->nullable()->after('dose');
            }

            if (! Schema::hasColumn('child_medications', 'usage_days')) {
                $table->json('usage_days')->nullable()->after('usage_time');
            }
        });

        // 3. family_members tablosuna ekle
        Schema::table('family_members', function (Blueprint $table) {
            if (! Schema::hasColumn('family_members', 'role')) {
                $table->enum('role', ['super_parent', 'co_parent'])->default('co_parent')->after('relation_type');
            }

            if (! Schema::hasColumn('family_members', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('role');
            }

            if (! Schema::hasColumn('family_members', 'invited_by_user_id')) {
                $table->foreignId('invited_by_user_id')->nullable()->after('is_active')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('family_members', 'accepted_at')) {
                $table->timestamp('accepted_at')->nullable()->after('invited_by_user_id');
            }
        });

        // 4. social_posts tablosuna is_global ekle + school_id/tenant_id nullable yap
        Schema::table('social_posts', function (Blueprint $table) {
            if (! Schema::hasColumn('social_posts', 'is_global')) {
                $table->boolean('is_global')->default(false)->after('is_pinned');
            }

            // school_id nullable yap (global postlar için)
            if (Schema::hasColumn('social_posts', 'school_id')) {
                $table->unsignedBigInteger('school_id')->nullable()->change();
            }

            // tenant_id nullable yap (global postlar için)
            if (Schema::hasColumn('social_posts', 'tenant_id')) {
                $table->unsignedBigInteger('tenant_id')->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('children', function (Blueprint $table) {
            $table->dropColumn(['identity_number', 'nationality_country_id', 'languages', 'parent_notes']);
        });

        Schema::table('child_medications', function (Blueprint $table) {
            $table->dropColumn(['custom_name', 'dose', 'usage_time', 'usage_days']);
        });

        Schema::table('family_members', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active', 'invited_by_user_id', 'accepted_at']);
        });

        Schema::table('social_posts', function (Blueprint $table) {
            $table->dropColumn('is_global');
        });
    }
};
