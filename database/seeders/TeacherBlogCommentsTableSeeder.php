<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TeacherBlogCommentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('teacher_blog_comments')->delete();

    }
}
