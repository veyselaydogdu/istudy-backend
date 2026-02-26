<?php

namespace Tests\Traits;

use App\Models\Academic\AcademicYear;
use App\Models\Academic\SchoolClass;
use App\Models\Health\Allergen;
use App\Models\Health\FoodIngredient;
use App\Models\Health\Meal;
use App\Models\Package\Package;
use App\Models\Package\TenantSubscription;
use App\Models\School\School;
use App\Models\Tenant\Tenant;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/**
 * Ortak test yardımcı metodları.
 * API feature testlerinde tekrar eden setup mantığını merkezi hale getirir.
 */
trait ApiTestHelpers
{
    /**
     * Tenant sahibi kullanıcı oluştur ve Sanctum ile authenticate et.
     * Tenant ve aktif abonelik otomatik oluşturulur.
     *
     * @return array{user: User, tenant: Tenant, subscription: TenantSubscription, package: Package}
     */
    protected function createAuthenticatedTenant(): array
    {
        $user = User::factory()->create();

        // Tenant oluştur
        $tenant = Tenant::withoutGlobalScopes()->create([
            'name' => 'Test Kurum',
            'owner_user_id' => $user->id,
            'created_by' => $user->id,
        ]);

        // User'a tenant_id ata
        $user->update(['tenant_id' => $tenant->id]);

        // Paket oluştur
        $package = Package::create([
            'name' => 'Test Paket',
            'max_schools' => 5,
            'max_classes_per_school' => 10,
            'max_students' => 100,
            'monthly_price' => 299,
            'yearly_price' => 2990,
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        // Aktif abonelik oluştur
        $subscription = TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'package_id' => $package->id,
            'status' => 'active',
            'billing_cycle' => 'monthly',
            'price' => $package->monthly_price,
            'start_date' => now(),
            'end_date' => now()->addMonth(),
            'created_by' => $user->id,
        ]);

        Sanctum::actingAs($user);

        return compact('user', 'tenant', 'subscription', 'package');
    }

    /**
     * Authenticated tenant için bir okul oluştur.
     */
    protected function createSchool(Tenant $tenant, User $createdBy, array $overrides = []): School
    {
        return School::withoutGlobalScopes()->create(array_merge([
            'tenant_id' => $tenant->id,
            'name' => 'Test Okulu',
            'code' => 'SCH-'.uniqid(),
            'is_active' => true,
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * Bir okul için eğitim yılı oluştur.
     */
    protected function createAcademicYear(School $school, User $createdBy, array $overrides = []): AcademicYear
    {
        return AcademicYear::withoutGlobalScopes()->create(array_merge([
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_active' => true,
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * Sınıf oluştur.
     */
    protected function createClass(School $school, AcademicYear $year, User $createdBy, array $overrides = []): SchoolClass
    {
        return SchoolClass::withoutGlobalScopes()->create(array_merge([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'A Sınıfı',
            'capacity' => 20,
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * Global allerjen oluştur (tenant_id = null, admin tarafından).
     */
    protected function createGlobalAllergen(User $createdBy, array $overrides = []): Allergen
    {
        return Allergen::withoutGlobalScopes()->create(array_merge([
            'tenant_id' => null,
            'name' => 'Gluten',
            'risk_level' => 'high',
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * Tenant'a özel allerjen oluştur.
     */
    protected function createTenantAllergen(Tenant $tenant, User $createdBy, array $overrides = []): Allergen
    {
        return Allergen::withoutGlobalScopes()->create(array_merge([
            'tenant_id' => $tenant->id,
            'name' => 'Fıstık',
            'risk_level' => 'high',
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * Global besin öğesi oluştur (tenant_id = null).
     */
    protected function createGlobalIngredient(User $createdBy, array $overrides = []): FoodIngredient
    {
        return FoodIngredient::withoutGlobalScopes()->create(array_merge([
            'tenant_id' => null,
            'name' => 'Buğday Unu',
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * Tenant'a özel besin öğesi oluştur.
     */
    protected function createTenantIngredient(Tenant $tenant, User $createdBy, array $overrides = []): FoodIngredient
    {
        return FoodIngredient::withoutGlobalScopes()->create(array_merge([
            'tenant_id' => $tenant->id,
            'name' => 'Özel Malzeme',
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * Okul için yemek oluştur.
     */
    protected function createMeal(School $school, User $createdBy, array $overrides = []): Meal
    {
        if (! isset($overrides['academic_year_id'])) {
            $year = $this->createAcademicYear($school, $createdBy);
            $overrides['academic_year_id'] = $year->id;
        }

        return Meal::withoutGlobalScopes()->create(array_merge([
            'school_id' => $school->id,
            'name' => 'Test Yemeği',
            'meal_type' => 'lunch',
            'created_by' => $createdBy->id,
        ], $overrides));
    }

    /**
     * API response'da temel başarı yapısını doğrula.
     */
    protected function assertApiSuccess(\Illuminate\Testing\TestResponse $response, int $status = 200): void
    {
        $response->assertStatus($status)
            ->assertJsonStructure(['success', 'message', 'data'])
            ->assertJson(['success' => true]);
    }

    /**
     * API response'da başarısızlık yapısını doğrula.
     */
    protected function assertApiError(\Illuminate\Testing\TestResponse $response, int $status): void
    {
        $response->assertStatus($status)
            ->assertJsonStructure(['success', 'message'])
            ->assertJson(['success' => false]);
    }
}
