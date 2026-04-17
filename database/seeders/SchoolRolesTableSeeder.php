<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolRolesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_roles')->delete();

    }
}
