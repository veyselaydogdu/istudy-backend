<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class NotificationPreferencesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('notification_preferences')->delete();

    }
}
