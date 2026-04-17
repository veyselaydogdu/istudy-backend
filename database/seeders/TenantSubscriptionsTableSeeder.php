<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantSubscriptionsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('tenant_subscriptions')->delete();

    }
}
