<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AuthorizedPickupsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('authorized_pickups')->delete();

    }
}
