<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SocialPostsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('social_posts')->delete();

    }
}
