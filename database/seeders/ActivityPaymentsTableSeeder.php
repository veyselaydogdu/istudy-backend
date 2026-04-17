<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityPaymentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_payments')->delete();

    }
}
