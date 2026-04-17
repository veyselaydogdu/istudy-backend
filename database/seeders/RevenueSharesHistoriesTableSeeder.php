<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RevenueSharesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('revenue_shares_histories')->delete();

    }
}
