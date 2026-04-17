<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityClassTeachersTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_class_teachers')->delete();

    }
}
