<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('tenants_histories')->delete();

    }
}
