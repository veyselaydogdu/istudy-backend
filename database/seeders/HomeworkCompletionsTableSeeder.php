<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class HomeworkCompletionsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('homework_completions')->delete();

    }
}
