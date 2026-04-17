<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class HomeworkHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('homework_histories')->delete();

    }
}
