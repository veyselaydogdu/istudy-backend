<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantPaymentsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('tenant_payments_histories')->delete();

    }
}
