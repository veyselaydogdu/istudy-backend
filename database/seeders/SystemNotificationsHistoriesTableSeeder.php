<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SystemNotificationsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('system_notifications_histories')->delete();

    }
}
