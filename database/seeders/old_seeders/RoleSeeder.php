<?php

namespace Database\Seeders\old_seeders;

use App\Models\Base\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'super_admin', 'label' => 'Super Admin'],
            ['name' => 'tenant_owner', 'label' => 'Kurum Sahibi'],
            ['name' => 'school_admin', 'label' => 'Okul Yöneticisi'],
            ['name' => 'teacher', 'label' => 'Öğretmen'],
            ['name' => 'parent', 'label' => 'Veli'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
