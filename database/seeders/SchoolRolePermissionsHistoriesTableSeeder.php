<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolRolePermissionsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_role_permissions_histories')->delete();

    }
}
