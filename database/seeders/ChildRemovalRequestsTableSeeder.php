<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildRemovalRequestsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_removal_requests')->delete();

    }
}
