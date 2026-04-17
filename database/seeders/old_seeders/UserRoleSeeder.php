<?php

namespace Database\Seeders\old_seeders;

use App\Models\Base\UserRole;
use Illuminate\Database\Seeder;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['id' => UserRole::SUPER_ADMIN, 'name' => 'super_admin', 'label' => 'Super Admin'],
            ['id' => UserRole::TENANT,      'name' => 'tenant',      'label' => 'Tenant'],
            ['id' => UserRole::TEACHER,     'name' => 'teacher',     'label' => 'Öğretmen'],
            ['id' => UserRole::PARENT,      'name' => 'parent',      'label' => 'Veli'],
            ['id' => UserRole::STUDENT,     'name' => 'student',     'label' => 'Öğrenci'],
        ];

        foreach ($roles as $role) {
            UserRole::updateOrCreate(
                ['id' => $role['id']],
                ['name' => $role['name'], 'label' => $role['label']]
            );
        }
    }
}
