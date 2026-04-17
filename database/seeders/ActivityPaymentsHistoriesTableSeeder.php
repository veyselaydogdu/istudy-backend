<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityPaymentsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_payments_histories')->delete();

    }
}
