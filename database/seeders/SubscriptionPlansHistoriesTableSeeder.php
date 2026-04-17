<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SubscriptionPlansHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('subscription_plans_histories')->delete();

    }
}
