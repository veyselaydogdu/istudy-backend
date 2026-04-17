<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ChildMaterialTrackingsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('child_material_trackings')->delete();

    }
}
