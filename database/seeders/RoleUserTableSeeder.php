<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RoleUserTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('role_user')->delete();

        \DB::table('role_user')->insert([
            0 => [
                'id' => 1,
                'user_id' => 1,
                'role_id' => 1,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'user_id' => 2,
                'role_id' => 5,
                'created_at' => '2026-04-17 10:48:02',
                'updated_at' => '2026-04-17 10:48:02',
            ],
            2 => [
                'id' => 3,
                'user_id' => 3,
                'role_id' => 5,
                'created_at' => '2026-04-17 10:48:31',
                'updated_at' => '2026-04-17 10:48:31',
            ],
        ]);

    }
}
