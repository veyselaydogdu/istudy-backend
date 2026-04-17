<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserRolesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('user_roles')->delete();

        \DB::table('user_roles')->insert([
            0 => [
                'id' => 1,
                'name' => 'super_admin',
                'label' => 'Super Admin',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 5,
                'name' => 'tenant',
                'label' => 'Tenant',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 10,
                'name' => 'teacher',
                'label' => 'Öğretmen',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            3 => [
                'id' => 15,
                'name' => 'parent',
                'label' => 'Veli',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            4 => [
                'id' => 20,
                'name' => 'student',
                'label' => 'Öğrenci',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
        ]);

    }
}
