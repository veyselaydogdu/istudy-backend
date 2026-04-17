<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RolesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('roles_histories')->delete();

        \DB::table('roles_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "name": "super_admin", "label": "Super Admin", "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z"}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "name": "tenant_owner", "label": "Kurum Sahibi", "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z"}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 3,
                'original_id' => 3,
                'operation_type' => 'create',
                'snapshot' => '{"id": 3, "name": "school_admin", "label": "Okul Yöneticisi", "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z"}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            3 => [
                'id' => 4,
                'original_id' => 4,
                'operation_type' => 'create',
                'snapshot' => '{"id": 4, "name": "teacher", "label": "Öğretmen", "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z"}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            4 => [
                'id' => 5,
                'original_id' => 5,
                'operation_type' => 'create',
                'snapshot' => '{"id": 5, "name": "parent", "label": "Veli", "created_at": "2026-04-17T10:47:08.000000Z", "created_by": 1, "updated_at": "2026-04-17T10:47:08.000000Z"}',
                'operated_by' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
        ]);

    }
}
