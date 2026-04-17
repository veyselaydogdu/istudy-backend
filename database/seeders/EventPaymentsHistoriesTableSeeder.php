<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EventPaymentsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('event_payments_histories')->delete();

    }
}
