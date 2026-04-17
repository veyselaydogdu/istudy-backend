<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PlanTierPricingTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('plan_tier_pricing')->delete();

    }
}
