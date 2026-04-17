<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PlanTierPricingHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('plan_tier_pricing_histories')->delete();

    }
}
