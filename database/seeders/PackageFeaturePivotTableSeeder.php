<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PackageFeaturePivotTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('package_feature_pivot')->delete();

        \DB::table('package_feature_pivot')->insert([
            0 => [
                'id' => 1,
                'package_id' => 1,
                'package_feature_id' => 1,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            1 => [
                'id' => 2,
                'package_id' => 1,
                'package_feature_id' => 2,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            2 => [
                'id' => 3,
                'package_id' => 1,
                'package_feature_id' => 3,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            3 => [
                'id' => 4,
                'package_id' => 1,
                'package_feature_id' => 10,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            4 => [
                'id' => 5,
                'package_id' => 2,
                'package_feature_id' => 1,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            5 => [
                'id' => 6,
                'package_id' => 2,
                'package_feature_id' => 2,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            6 => [
                'id' => 7,
                'package_id' => 2,
                'package_feature_id' => 3,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            7 => [
                'id' => 8,
                'package_id' => 2,
                'package_feature_id' => 4,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            8 => [
                'id' => 9,
                'package_id' => 2,
                'package_feature_id' => 5,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            9 => [
                'id' => 10,
                'package_id' => 2,
                'package_feature_id' => 6,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            10 => [
                'id' => 11,
                'package_id' => 2,
                'package_feature_id' => 10,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            11 => [
                'id' => 12,
                'package_id' => 3,
                'package_feature_id' => 1,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            12 => [
                'id' => 13,
                'package_id' => 3,
                'package_feature_id' => 2,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            13 => [
                'id' => 14,
                'package_id' => 3,
                'package_feature_id' => 3,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            14 => [
                'id' => 15,
                'package_id' => 3,
                'package_feature_id' => 4,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            15 => [
                'id' => 16,
                'package_id' => 3,
                'package_feature_id' => 5,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            16 => [
                'id' => 17,
                'package_id' => 3,
                'package_feature_id' => 6,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            17 => [
                'id' => 18,
                'package_id' => 3,
                'package_feature_id' => 7,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            18 => [
                'id' => 19,
                'package_id' => 3,
                'package_feature_id' => 8,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            19 => [
                'id' => 20,
                'package_id' => 3,
                'package_feature_id' => 9,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
            20 => [
                'id' => 21,
                'package_id' => 3,
                'package_feature_id' => 10,
                'value' => 'true',
                'created_at' => '2026-04-17 10:47:08',
                'updated_at' => '2026-04-17 10:47:08',
            ],
        ]);

    }
}
