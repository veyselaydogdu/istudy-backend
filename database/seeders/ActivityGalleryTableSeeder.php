<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivityGalleryTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('activity_gallery')->delete();

    }
}
