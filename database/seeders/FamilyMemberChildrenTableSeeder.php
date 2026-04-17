<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FamilyMemberChildrenTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('family_member_children')->delete();

    }
}
