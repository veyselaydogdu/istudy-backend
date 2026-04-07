<?php

namespace Tests\Feature;

use App\Models\ActivityClass\ActivityClass;
use App\Models\Child\AuthorizedPickup;
use App\Models\Child\Child;
use App\Models\Child\FamilyProfile;
use App\Models\School\School;
use App\Models\School\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Hibrit ULID mimarisi testleri.
 *
 * Kapsam:
 *  - HasUlid trait: model oluşturmada ULID otomatik üretilir
 *  - API Resources: `id` alanı ULID döner
 *  - Route model binding: ULID ile çözümleme
 *  - BaseSchoolController: ULID ve integer school_id desteği
 *  - Tenant izolasyonu: ULID geçse dahi başka tenant'a erişim 403
 */
class UlidArchitectureTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── ULID OTO-ÜRETME ────────────────────────────────────────────

    /** @test */
    public function user_olusturulunca_ulid_otomatik_atanir(): void
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->ulid);
        $this->assertEquals(26, strlen($user->ulid));
    }

    /** @test */
    public function child_olusturulunca_ulid_otomatik_atanir(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);
        $fp = FamilyProfile::withoutGlobalScope('tenant')->create([
            'owner_user_id' => $user->id,
            'tenant_id' => null,
            'created_by' => $user->id,
        ]);

        $child = Child::withoutGlobalScope('tenant')->create([
            'family_profile_id' => $fp->id,
            'first_name' => 'Ali',
            'last_name' => 'Veli',
            'birth_date' => '2020-01-01',
            'gender' => 'male',
            'created_by' => $user->id,
        ]);

        $this->assertNotNull($child->ulid);
        $this->assertEquals(26, strlen($child->ulid));
    }

    /** @test */
    public function school_olusturulunca_ulid_otomatik_atanir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $this->assertNotNull($school->ulid);
        $this->assertEquals(26, strlen($school->ulid));
    }

    /** @test */
    public function teacher_profile_olusturulunca_ulid_otomatik_atanir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $teacherUser = User::factory()->create(['tenant_id' => $tenant->id]);
        $profile = TeacherProfile::withoutGlobalScopes()->create([
            'user_id' => $teacherUser->id,
            'tenant_id' => $tenant->id,
            'school_id' => $school->id,
            'created_by' => $user->id,
        ]);

        $this->assertNotNull($profile->ulid);
        $this->assertEquals(26, strlen($profile->ulid));
    }

    /** @test */
    public function family_profile_olusturulunca_ulid_otomatik_atanir(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);
        $fp = FamilyProfile::withoutGlobalScope('tenant')->create([
            'owner_user_id' => $user->id,
            'tenant_id' => null,
            'created_by' => $user->id,
        ]);

        $this->assertNotNull($fp->ulid);
        $this->assertEquals(26, strlen($fp->ulid));
    }

    /** @test */
    public function authorized_pickup_olusturulunca_ulid_otomatik_atanir(): void
    {
        $user = User::factory()->create(['tenant_id' => null]);
        $fp = FamilyProfile::withoutGlobalScope('tenant')->create([
            'owner_user_id' => $user->id,
            'tenant_id' => null,
            'created_by' => $user->id,
        ]);
        $child = Child::withoutGlobalScope('tenant')->create([
            'family_profile_id' => $fp->id,
            'first_name' => 'Test',
            'last_name' => 'Child',
            'birth_date' => '2020-01-01',
            'gender' => 'male',
            'created_by' => $user->id,
        ]);

        $pickup = AuthorizedPickup::withoutGlobalScope('tenant')->create([
            'child_id' => $child->id,
            'family_profile_id' => $fp->id,
            'first_name' => 'Ahmet',
            'last_name' => 'Dayı',
            'phone' => '05551112233',
            'relation' => 'uncle',
            'created_by' => $user->id,
        ]);

        $this->assertNotNull($pickup->ulid);
        $this->assertEquals(26, strlen($pickup->ulid));
    }

    /** @test */
    public function her_modelin_ulidi_benzersizdir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();

        $school1 = $this->createSchool($tenant, $user, ['name' => 'Okul 1', 'code' => 'S1']);
        $school2 = $this->createSchool($tenant, $user, ['name' => 'Okul 2', 'code' => 'S2']);

        $this->assertNotEquals($school1->ulid, $school2->ulid);
    }

    // ─── ROUTE KEY NAME ─────────────────────────────────────────────

    /** @test */
    public function school_route_key_name_ulid_doner(): void
    {
        $school = new School;
        $this->assertEquals('ulid', $school->getRouteKeyName());
    }

    /** @test */
    public function child_route_key_name_ulid_doner(): void
    {
        $child = new Child;
        $this->assertEquals('ulid', $child->getRouteKeyName());
    }

    /** @test */
    public function teacher_profile_route_key_name_ulid_doner(): void
    {
        $profile = new TeacherProfile;
        $this->assertEquals('ulid', $profile->getRouteKeyName());
    }

    /** @test */
    public function activity_class_route_key_name_ulid_doner(): void
    {
        $ac = new ActivityClass;
        $this->assertEquals('ulid', $ac->getRouteKeyName());
    }

    // ─── API RESOURCE: id ALANI ULID ────────────────────────────────

    /** @test */
    public function okul_listesi_id_alani_ulid_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user, ['name' => 'ULID Test Okul']);

        $response = $this->getJson('/api/schools');

        $response->assertStatus(200);

        $schoolData = collect($response->json('data'))->firstWhere('name', 'ULID Test Okul');
        $this->assertNotNull($schoolData);
        $this->assertEquals($school->ulid, $schoolData['id']);
        $this->assertNotEquals($school->id, $schoolData['id']); // INTEGER değil, ULID
    }

    /** @test */
    public function okul_detayi_id_alani_ulid_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->getJson('/api/schools/'.$school->ulid);

        $response->assertStatus(200);
        $this->assertEquals($school->ulid, $response->json('data.id'));
    }

    // ─── ROUTE MODEL BINDING VIA ULID ───────────────────────────────

    /** @test */
    public function okul_ulid_ile_route_model_binding_calisir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user, ['name' => 'Binding Test Okul']);

        $response = $this->getJson('/api/schools/'.$school->ulid);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.id', $school->ulid);
    }

    /** @test */
    public function yanlis_ulid_404_doner(): void
    {
        $this->createAuthenticatedTenant();

        $fakeUlid = (string) Str::ulid();
        $response = $this->getJson('/api/schools/'.$fakeUlid);

        $response->assertStatus(404);
    }

    // ─── BASE SCHOOL CONTROLLER: ULID & INTEGER DESTEGI ─────────────

    /** @test */
    public function school_id_integer_olarak_gecilince_calisir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        // Tenant routes: /api/schools/{school_id}/classes — integer param
        $response = $this->getJson('/api/schools/'.$school->id.'/classes');

        $response->assertStatus(200);
    }

    /** @test */
    public function school_id_ulid_olarak_gecilince_calisir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        // Same route with ULID
        $response = $this->getJson('/api/schools/'.$school->ulid.'/classes');

        $response->assertStatus(200);
    }

    /** @test */
    public function baska_tenant_okul_id_ile_erisim_403_doner(): void
    {
        ['user' => $userA, 'tenant' => $tenantA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);

        // Tenant A olarak Tenant B'nin ULID'ini dene
        \Laravel\Sanctum\Sanctum::actingAs($userA);
        $response = $this->getJson('/api/schools/'.$schoolB->ulid.'/classes');

        $response->assertStatus(403);
    }

    /** @test */
    public function baska_tenant_okul_integer_id_ile_erisim_403_doner(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);
        $response = $this->getJson('/api/schools/'.$schoolB->id.'/classes');

        $response->assertStatus(403);
    }

    // ─── PARENT ROUTES: CHILD ULID BINDING ──────────────────────────

    /** @test */
    public function veli_child_detail_ulid_ile_calisir(): void
    {
        $parentUser = User::factory()->create(['tenant_id' => null]);
        $fp = FamilyProfile::withoutGlobalScope('tenant')->create([
            'owner_user_id' => $parentUser->id,
            'tenant_id' => null,
            'created_by' => $parentUser->id,
        ]);

        // FamilyMember (super_parent)
        \App\Models\Child\FamilyMember::withoutGlobalScope('tenant')->create([
            'family_profile_id' => $fp->id,
            'user_id' => $parentUser->id,
            'relation_type' => 'parent',
            'role' => 'super_parent',
            'is_active' => true,
            'accepted_at' => now(),
            'created_by' => $parentUser->id,
        ]);

        $child = Child::withoutGlobalScope('tenant')->create([
            'family_profile_id' => $fp->id,
            'first_name' => 'Test',
            'last_name' => 'Çocuk',
            'birth_date' => '2020-05-10',
            'gender' => 'male',
            'created_by' => $parentUser->id,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($parentUser, ['role:parent']);

        $response = $this->getJson('/api/parent/children/'.$child->ulid);

        $response->assertStatus(200);
        $this->assertEquals($child->ulid, $response->json('data.id'));
    }
}
