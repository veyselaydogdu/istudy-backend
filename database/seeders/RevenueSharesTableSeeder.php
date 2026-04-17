<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RevenueSharesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('revenue_shares')->delete();

    }
}
