<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildEventParticipationsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_event_participations')->delete();

    }
}
