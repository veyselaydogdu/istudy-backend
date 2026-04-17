<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TenantPaymentsTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('tenant_payments')->delete();

    }
}
