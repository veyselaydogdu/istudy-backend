<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolRolePermissionsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_role_permissions')->delete();

    }
}
