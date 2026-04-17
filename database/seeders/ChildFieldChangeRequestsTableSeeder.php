<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildFieldChangeRequestsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_field_change_requests')->delete();

    }
}
