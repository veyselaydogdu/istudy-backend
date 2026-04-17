<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class HomeworkClassAssignmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('homework_class_assignments')->delete();

    }
}
