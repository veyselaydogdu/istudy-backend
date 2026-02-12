<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Policy kayıtları
        Gate::policy(\App\Models\School\School::class, \App\Policies\SchoolPolicy::class);
        Gate::policy(\App\Models\Academic\SchoolClass::class, \App\Policies\SchoolClassPolicy::class);
        Gate::policy(\App\Models\Child\Child::class, \App\Policies\ChildPolicy::class);
        Gate::policy(\App\Models\Activity\Activity::class, \App\Policies\ActivityPolicy::class);
        Gate::policy(\App\Models\Child\FamilyProfile::class, \App\Policies\FamilyProfilePolicy::class);
        Gate::policy(\App\Models\Tenant\Tenant::class, \App\Policies\TenantPolicy::class);
        Gate::policy(\App\Models\Billing\FamilySubscription::class, \App\Policies\FamilySubscriptionPolicy::class);
    }
}
