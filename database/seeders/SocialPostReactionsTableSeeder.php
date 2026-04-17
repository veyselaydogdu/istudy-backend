<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SocialPostReactionsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('social_post_reactions')->delete();

    }
}
