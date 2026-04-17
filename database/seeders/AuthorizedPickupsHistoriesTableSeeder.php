<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AuthorizedPickupsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('authorized_pickups_histories')->delete();

    }
}
