<?php

namespace Database\Seeders;

use App\Models\Base\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Veritabanını seed'le
     *
     * Sıralama: Önce User (auth bağımlılığı yok), sonra Roller ve Paketler
     */
    public function run(): void
    {
        // 1️⃣ Super Admin kullanıcı oluştur (created_by bağımlılığı için ilk sırada)
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@istudy.com'],
            [
                'name' => 'Super Admin',
                'password' => 'password',
                'phone' => '+905551234567',
            ]
        );

        // Auth context'i simüle et (BaseModel'in created_by otomatik set etmesi için)
        auth()->login($superAdmin);

        // 2️⃣ Rolleri oluştur
        $this->call(RoleSeeder::class);

        // 3️⃣ Super Admin'e rol ata
        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole && ! $superAdmin->roles->contains($superAdminRole->id)) {
            $superAdmin->roles()->syncWithoutDetaching([$superAdminRole->id]);
        }

        // 4️⃣ Paketleri oluştur
        $this->call(PackageSeeder::class);

        // Auth context'i temizle
        auth()->logout();
    }
}
