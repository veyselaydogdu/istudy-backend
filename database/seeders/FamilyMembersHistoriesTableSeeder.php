<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FamilyMembersHistoriesTableSeeder extends Seeder
{
    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {

        \DB::table('family_members_histories')->delete();

        \DB::table('family_members_histories')->insert([
            0 => [
                'id' => 1,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "role": "super_parent", "user_id": 3, "is_active": true, "created_at": "2026-04-17T10:46:21.000000Z", "created_by": 3, "updated_at": "2026-04-17T10:46:21.000000Z", "accepted_at": "2026-04-17T10:46:21.000000Z", "relation_type": "owner", "family_profile_id": 1, "invitation_status": "accepted"}',
                'operated_by' => 3,
                'created_at' => '2026-04-17 10:46:21',
                'updated_at' => '2026-04-17 10:46:21',
            ],
            1 => [
                'id' => 2,
                'original_id' => 1,
                'operation_type' => 'create',
                'snapshot' => '{"id": 1, "role": "super_parent", "user_id": 2, "is_active": true, "created_at": "2026-04-17T10:49:27.000000Z", "created_by": 2, "updated_at": "2026-04-17T10:49:27.000000Z", "accepted_at": "2026-04-17T10:49:27.000000Z", "relation_type": "owner", "family_profile_id": 1, "invitation_status": "accepted"}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 10:49:27',
                'updated_at' => '2026-04-17 10:49:27',
            ],
            2 => [
                'id' => 3,
                'original_id' => 2,
                'operation_type' => 'create',
                'snapshot' => '{"id": 2, "role": "co_parent", "user_id": 3, "is_active": false, "created_at": "2026-04-17T10:49:46.000000Z", "created_by": 2, "updated_at": "2026-04-17T10:49:46.000000Z", "accepted_at": null, "relation_type": "Baba", "family_profile_id": 1, "invitation_status": "pending", "invited_by_user_id": 2}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 10:49:46',
                'updated_at' => '2026-04-17 10:49:46',
            ],
            3 => [
                'id' => 4,
                'original_id' => 2,
                'operation_type' => 'delete',
                'snapshot' => '{"id": 2, "role": "co_parent", "email": null, "phone": null, "address": null, "user_id": 3, "is_active": false, "last_name": null, "created_at": "2026-04-17T10:49:46.000000Z", "created_by": 2, "deleted_at": "2026-04-17T10:58:21.000000Z", "first_name": null, "is_primary": 0, "updated_at": "2026-04-17T10:58:21.000000Z", "updated_by": null, "accepted_at": null, "relation_type": "Baba", "family_profile_id": 1, "invitation_status": "pending", "invited_by_user_id": 2, "is_emergency_contact": 0}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 10:58:21',
                'updated_at' => '2026-04-17 10:58:21',
            ],
            4 => [
                'id' => 5,
                'original_id' => 3,
                'operation_type' => 'create',
                'snapshot' => '{"id": 3, "role": "super_parent", "user_id": 2, "is_active": true, "created_at": "2026-04-17T11:02:28.000000Z", "created_by": 2, "updated_at": "2026-04-17T11:02:28.000000Z", "accepted_at": "2026-04-17T11:02:28.000000Z", "relation_type": "owner", "family_profile_id": 2, "invitation_status": "accepted"}',
                'operated_by' => 2,
                'created_at' => '2026-04-17 11:02:28',
                'updated_at' => '2026-04-17 11:02:28',
            ],
        ]);

    }
}
