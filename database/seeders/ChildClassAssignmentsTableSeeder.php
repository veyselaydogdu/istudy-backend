<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildClassAssignmentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_class_assignments')->delete();

    }
}
