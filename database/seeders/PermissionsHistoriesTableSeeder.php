<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PermissionsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('permissions_histories')->delete();

    }
}
