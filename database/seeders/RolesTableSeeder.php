<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RolesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('roles')->delete();

        \DB::table('roles')->insert([
            0 => [
                'id' => 1,
                'name' => 'super_admin',
                'label' => 'Super Admin',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'name' => 'tenant_owner',
                'label' => 'Kurum Sahibi',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            2 => [
                'id' => 3,
                'name' => 'school_admin',
                'label' => 'Okul Yöneticisi',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            3 => [
                'id' => 4,
                'name' => 'teacher',
                'label' => 'Öğretmen',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            4 => [
                'id' => 5,
                'name' => 'parent',
                'label' => 'Veli',
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
        ]);

    }
}
