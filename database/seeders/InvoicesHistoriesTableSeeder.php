<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class InvoicesHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('invoices_histories')->delete();

    }
}
