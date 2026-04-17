<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UsersHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('users_histories')->delete();

    }
}
