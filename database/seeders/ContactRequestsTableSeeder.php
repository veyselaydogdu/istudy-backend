<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ContactRequestsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('contact_requests')->delete();

    }
}
