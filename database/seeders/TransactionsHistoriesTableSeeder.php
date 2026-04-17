<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TransactionsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('transactions_histories')->delete();

    }
}
