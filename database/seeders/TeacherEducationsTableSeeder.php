<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TeacherEducationsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('teacher_educations')->delete();

    }
}
