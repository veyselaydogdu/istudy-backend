<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FamilyMembersTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('family_members')->delete();

        \DB::table('family_members')->insert([
            0 => [
                'id' => 1,
                'family_profile_id' => 1,
                'user_id' => 2,
                'relation_type' => 'owner',
                'role' => 'super_parent',
                'is_active' => 1,
                'invited_by_user_id' => null,
                'accepted_at' => '2026-04-17 10:49:27',
                'invitation_status' => 'accepted',
                'first_name' => null,
                'last_name' => null,
                'phone' => null,
                'email' => null,
                'address' => null,
                'is_emergency_contact' => 0,
                'is_primary' => 0,
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:49:27',
                'updated_at' => '2026-04-17 10:49:27',
                'deleted_at' => null,
            ],
            1 => [
                'id' => 2,
                'family_profile_id' => 1,
                'user_id' => 3,
                'relation_type' => 'Baba',
                'role' => 'co_parent',
                'is_active' => 0,
                'invited_by_user_id' => 2,
                'accepted_at' => null,
                'invitation_status' => 'pending',
                'first_name' => null,
                'last_name' => null,
                'phone' => null,
                'email' => null,
                'address' => null,
                'is_emergency_contact' => 0,
                'is_primary' => 0,
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 10:49:46',
                'updated_at' => '2026-04-17 10:58:21',
                'deleted_at' => '2026-04-17 10:58:21',
            ],
            2 => [
                'id' => 3,
                'family_profile_id' => 2,
                'user_id' => 2,
                'relation_type' => 'owner',
                'role' => 'super_parent',
                'is_active' => 1,
                'invited_by_user_id' => null,
                'accepted_at' => '2026-04-17 11:02:28',
                'invitation_status' => 'accepted',
                'first_name' => null,
                'last_name' => null,
                'phone' => null,
                'email' => null,
                'address' => null,
                'is_emergency_contact' => 0,
                'is_primary' => 0,
                'created_by' => 2,
                'updated_by' => null,
                'created_at' => '2026-04-17 11:02:28',
                'updated_at' => '2026-04-17 11:02:28',
                'deleted_at' => null,
            ],
        ]);

    }
}
