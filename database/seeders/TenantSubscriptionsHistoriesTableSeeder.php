<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantSubscriptionsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('tenant_subscriptions_histories')->delete();

    }
}
