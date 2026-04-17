<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SchoolUserRolesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('school_user_roles_histories')->delete();

    }
}
