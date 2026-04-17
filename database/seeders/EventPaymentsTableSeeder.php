<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EventPaymentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('event_payments')->delete();

    }
}
