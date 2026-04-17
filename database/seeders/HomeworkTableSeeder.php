<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class HomeworkTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('homework')->delete();

    }
}
