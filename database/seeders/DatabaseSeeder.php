<?php

namespace Database\Seeders;

use App\Models\Base\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Veritabanını sıfırla ve başlangıç verilerini ekle.
     *
     * Sıralama (FK bağımlılıkları dikkate alınarak):
     *   1. Tablolar temizlenir (truncate + FK disable)
     *   2. Super Admin kullanıcı oluşturulur
     *   3. Roller oluşturulur ve admin'e atanır
     *   4. Paketler oluşturulur
     *   5. Global veriler eklenir (para birimleri, ülkeler, sağlık)
     */
    public function run(): void
    {
        // ── 1. Tüm tabloları temizle ──────────────────────────────────────────
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        $tables = [
            'role_user', 'roles', 'permissions', 'role_permissions',
            'teacher_blog_likes', 'teacher_blog_comments', 'teacher_blog_posts', 'teacher_follows',
            'child_pickup_logs', 'child_medication_logs', 'child_allergens', 'child_conditions',
            'child_medications', 'child_classes', 'children',
            'class_teacher_assignments', 'school_teacher_assignments', 'teacher_tenant_memberships',
            'teacher_profiles', 'teacher_educations', 'teacher_certificates',
            'teacher_courses', 'teacher_skills',
            'activity_class_gallery', 'activity_class_materials', 'activity_class_invoices',
            'activity_class_enrollments', 'activity_class_teachers', 'activity_classes',
            'attendances', 'daily_reports', 'activities', 'activity_child',
            'school_child_enrollment_requests', 'school_family_assignments',
            'family_members', 'family_profiles',
            'authorized_pickups', 'emergency_contacts',
            'classes', 'academic_years',
            'schools',
            'tenant_payments', 'tenant_subscriptions', 'package_features',
            'packages',
            'tenants',
            'user_contact_numbers',
            'food_ingredient_allergens', 'food_ingredients',
            'allergens', 'medical_conditions', 'medications',
            'currencies', 'countries',
            'invoices', 'invoice_items', 'transactions',
            'notifications', 'activity_logs',
            'meal_ingredients', 'meals',
            'contact_requests',
            'users',
        ];

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');

        $this->command->info('✅ Tüm tablolar temizlendi.');

        // ── 2. Super Admin kullanıcı ──────────────────────────────────────────
        $superAdmin = User::create([
            'name' => 'Super',
            'surname' => 'Admin',
            'email' => 'admin@istudy.com',
            'password' => Hash::make('Admin123!'),
            'phone' => '+905551234567',
        ]);

        $this->command->info('✅ Super Admin oluşturuldu: admin@istudy.com / Admin123!');

        // Auth context (BaseModel created_by için)
        auth()->login($superAdmin);

        // ── 3. Roller ─────────────────────────────────────────────────────────
        $this->call(RoleSeeder::class);

        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole) {
            $superAdmin->roles()->syncWithoutDetaching([$superAdminRole->id]);
        }

        $this->command->info('✅ Roller oluşturuldu ve Super Admin rolü atandı.');

        // ── 4. Paketler ───────────────────────────────────────────────────────
        $this->call(PackageSeeder::class);
        $this->command->info('✅ Paketler oluşturuldu.');

        // ── 5. Global veriler ─────────────────────────────────────────────────
        $this->call(InitialDataSeeder::class);
        $this->command->info('✅ Para birimleri, ülkeler, alerjenler, hastalıklar, besin öğeleri eklendi.');

        auth()->logout();

        $this->command->newLine();
        $this->command->info('🎉 Veritabanı başarıyla hazırlandı!');
        $this->command->table(
            ['Hesap', 'Değer'],
            [
                ['E-posta', 'admin@istudy.com'],
                ['Şifre', 'Admin123!'],
                ['Rol', 'super_admin'],
            ]
        );
    }
}
