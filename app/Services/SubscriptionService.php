<?php

namespace App\Services;

use App\Models\Billing\FamilySubscription;

class SubscriptionService extends BaseService
{
    protected function model(): string
    {
        return FamilySubscription::class;
    }

    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['family_profile_id'])) {
            $query->where('family_profile_id', $filters['family_profile_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
    }
}
