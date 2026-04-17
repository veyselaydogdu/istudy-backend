<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FamilySubscriptionsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('family_subscriptions_histories')->delete();

    }
}
