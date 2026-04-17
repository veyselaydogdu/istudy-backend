<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildPricingSettingsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_pricing_settings')->delete();

    }
}
