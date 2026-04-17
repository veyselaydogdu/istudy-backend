<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TeacherBlogLikesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('teacher_blog_likes')->delete();

    }
}
