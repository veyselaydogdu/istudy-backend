<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FamilySubscriptionsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('family_subscriptions')->delete();

    }
}
