<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PaymentsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('payments_histories')->delete();

    }
}
