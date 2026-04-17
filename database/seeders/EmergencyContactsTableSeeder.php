<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EmergencyContactsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('emergency_contacts')->delete();

    }
}
