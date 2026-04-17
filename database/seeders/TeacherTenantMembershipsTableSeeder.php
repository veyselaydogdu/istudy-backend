<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TeacherTenantMembershipsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('teacher_tenant_memberships')->delete();

    }
}
