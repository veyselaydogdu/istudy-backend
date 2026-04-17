<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserContactNumbersTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('user_contact_numbers')->delete();

    }
}
