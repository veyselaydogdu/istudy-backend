<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolRolesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_roles_histories')->delete();

    }
}
