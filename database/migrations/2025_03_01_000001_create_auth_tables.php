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
    | Bu dosya Kullanıcılar, Roller ve İzinler tablolarını içerir.
    | Users: Sisteme giriş yapan tüm kullanıcıları (Admin, Veli, Öğretmen vb.) temsil eder.
    | Roles/Permissions: RBAC (Role Based Access Control) mimarisinin temel yapı taşlarıdır.
    */

    public function up(): void
    {
        // 1. USERS
        if (! Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id()->comment('Kullanıcı ID');
                $table->string('name')->comment('Ad Soyad');
                $table->string('email')->unique()->comment('E-posta');
                $table->string('phone')->nullable()->comment('Telefon');
                $table->string('password')->comment('Şifre');
                $table->string('locale')->default('tr')->comment('Dil Seçeneği');
                $table->timestamp('last_login_at')->nullable()->comment('Son Giriş Tarihi');

                // Standart Alanlar (Users tablosunda created_by nullable olmak zorunda: first seed için)
                $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnDelete()->comment('Oluşturan Kullanıcı');
                $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete()->comment('Güncelleyen Kullanıcı');
                $table->timestamps();
                $table->softDeletes();

                $table->index('email');
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'name')) {
                    $table->string('name')->comment('Ad Soyad');
                }

                if (! Schema::hasColumn('users', 'phone')) {
                    $table->string('phone')->nullable()->comment('Telefon');
                }
                if (! Schema::hasColumn('users', 'locale')) {
                    $table->string('locale')->default('tr')->comment('Dil Seçeneği');
                }
                if (! Schema::hasColumn('users', 'last_login_at')) {
                    $table->timestamp('last_login_at')->nullable()->comment('Son Giriş Tarihi');
                }

                if (! Schema::hasColumn('users', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnDelete()->comment('Oluşturan Kullanıcı');
                }
                if (! Schema::hasColumn('users', 'updated_by')) {
                    $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete()->comment('Güncelleyen Kullanıcı');
                }
                if (! Schema::hasColumn('users', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // Users History
        Schema::create('users_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type'); // create, update, delete
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 2. ROLES
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // super_admin, tenant_owner, etc.
            $table->string('label')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // Roles History
        Schema::create('roles_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 3. PERMISSIONS
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // Permissions History
        Schema::create('permissions_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_id')->index();
            $table->string('operation_type');
            $table->json('snapshot');
            $table->foreignId('operated_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 4. ROLE_USER (Pivot)
        Schema::create('role_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'role_id']);
            $table->index('user_id');
        });

        // 5. PERMISSION_ROLE (Pivot)
        Schema::create('permission_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['permission_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('permissions_histories');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles_histories');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users_histories');
        Schema::dropIfExists('users');
    }
};
