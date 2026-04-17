<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('users')->delete();

        \DB::table('users')->insert([
            0 => [
                'id' => 1,
                'role_id' => 1,
                'ulid' => '01KPDGTECQSAE1N83DYJ1CNS3S',
                'name' => 'Super',
                'surname' => 'Admin',
                'email' => 'admin@istudy.com',
                'phone' => '+905551234567',
                'country_id' => null,
                'password' => '$2y$12$B0kWpl49.DmnTaFr/teKaOHcHa4v9EOpbHNJUKoflvEfO6SCxNT2.',
                'locale' => 'tr',
                'tenant_id' => null,
                'is_active' => 1,
                'last_login_at' => null,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'role_id' => 15,
                'ulid' => '01KPDGW3MHCE3H1BFEQGDM0M2T',
                'name' => 'Selcan',
                'surname' => 'Turksever',
                'email' => 'selcan.turksever@gmail.com',
                'phone' => '+901251241231',
                'country_id' => null,
                'password' => '$2y$12$LUZFt/3HfVckDGEbmHwnrOXqrMCmUWhVbGj5vbA8GrDeV7uBhomH2',
                'locale' => 'tr',
                'tenant_id' => null,
                'is_active' => 1,
                'last_login_at' => '2026-04-17 10:49:17',
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:48:02',
                'updated_at' => '2026-04-17 10:49:17',
                'deleted_at' => null,
            ],
            2 => [
                'id' => 3,
                'role_id' => 15,
                'ulid' => '01KPDGWZW0SDRMN0Z5X4MQ68GH',
                'name' => 'Veysel',
                'surname' => 'Aydogdu',
                'email' => 'weysel.aydogdu@hotmail.com',
                'phone' => '+905141231231',
                'country_id' => null,
                'password' => '$2y$12$M27CoJLvlux5OPwPeM5kmOo4/XrmymLNziuoJM3UntAmGd6xRvT6m',
                'locale' => 'tr',
                'tenant_id' => null,
                'is_active' => 1,
                'last_login_at' => null,
                'created_by' => null,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:48:31',
                'updated_at' => '2026-04-17 10:48:31',
                'deleted_at' => null,
            ],
        ]);

    }
}
