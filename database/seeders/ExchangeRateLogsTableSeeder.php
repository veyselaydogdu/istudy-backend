<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ExchangeRateLogsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('exchange_rate_logs')->delete();

    }
}
