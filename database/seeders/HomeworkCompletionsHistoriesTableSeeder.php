<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class HomeworkCompletionsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('homework_completions_histories')->delete();

    }
}
