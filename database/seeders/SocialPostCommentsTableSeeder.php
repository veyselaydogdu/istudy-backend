<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SocialPostCommentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('social_post_comments')->delete();

    }
}
