<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MaterialsHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('materials_histories')->delete();

    }
}
