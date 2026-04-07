<?php

namespace Tests\Feature\API\Schools;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Okul (School) API Testleri
 * Kapsam: GET /schools, POST /schools, GET /schools/{id}, PUT /schools/{id}, DELETE /schools/{id}
 *
 * Not: SchoolController extends BaseSchoolController. Bu rotalar school_id route parametresi
 * içermez ({school} route binding kullanılır). Bu nedenle BUG-010 (User::schools() eksik)
 * bu rotalar için TETİKLENMEZ.
 */
class SchoolApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── INDEX ─────────────────────────────────────────────────────

    /** @test */
    public function index_tenant_okullarini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user, ['name' => 'Test Okulu 1']);

        $response = $this->getJson('/api/schools');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data', 'meta']);

        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('Test Okulu 1', $names);
    }

    /** @test */
    public function index_baska_tenant_okullarini_gostermez(): void
    {
        ['user' => $userA, 'tenant' => $tenantA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB, ['name' => 'B Okulu']);

        // Tenant A olarak istek yap
        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->getJson('/api/schools');
        $response->assertStatus(200);

        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertNotContains('B Okulu', $names);
    }

    /** @test */
    public function index_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/schools')->assertStatus(401);
    }

    /** @test */
    public function index_abonelik_olmadan_403_doner(): void
    {
        // Aboneliksiz kullanıcı oluştur
        $user = \App\Models\User::factory()->create();
        $tenant = \App\Models\Tenant\Tenant::withoutGlobalScopes()->create([
            'name' => 'Aboneliksiz Kurum',
            'owner_user_id' => $user->id,
            'created_by' => $user->id,
        ]);
        $user->update(['tenant_id' => $tenant->id]);

        \Laravel\Sanctum\Sanctum::actingAs($user);

        $response = $this->getJson('/api/schools');

        // subscription.active middleware 403 döndürmeli
        $response->assertStatus(403);
    }

    // ─── STORE ─────────────────────────────────────────────────────

    /** @test */
    public function store_yeni_okul_olusturur(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->postJson('/api/schools', [
            'name' => 'Yeni İlkokul',
            'code' => 'NIL-001',
            'email' => 'okul@test.com',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Yeni İlkokul');

        $this->assertDatabaseHas('schools', ['name' => 'Yeni İlkokul']);
    }

    /** @test */
    public function store_eksik_isim_ile_422_doner(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->postJson('/api/schools', [
            // name eksik
            'email' => 'test@test.com',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function store_auth_olmadan_401_doner(): void
    {
        $this->postJson('/api/schools', ['name' => 'Test'])->assertStatus(401);
    }

    /** @test */
    public function store_paket_limiti_asiminda_hata_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant, 'package' => $package] = $this->createAuthenticatedTenant();

        // Paketi 0 okul ile sınırla
        $package->update(['max_schools' => 0]);

        $response = $this->postJson('/api/schools', ['name' => 'Fazla Okul']);

        // Limit aşıldığında 400/422 döner
        $this->assertContains($response->status(), [400, 422, 403]);
    }

    // ─── SHOW ──────────────────────────────────────────────────────

    /** @test */
    public function show_okul_detayini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user, ['name' => 'Detay Okulu']);

        $response = $this->getJson("/api/schools/{$school->ulid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Detay Okulu');
    }

    /** @test */
    public function show_olmayan_okul_404_doner(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->getJson('/api/schools/9999');

        $response->assertStatus(404);
    }

    /** @test */
    public function show_baska_tenant_okulu_gorulemez(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->getJson("/api/schools/{$schoolB->ulid}");

        // Tenant scope nedeniyle 404 (model bulunamaz) veya 403
        $this->assertContains($response->status(), [403, 404]);
    }

    // ─── UPDATE ────────────────────────────────────────────────────

    /** @test */
    public function update_okul_gunceller(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user, ['name' => 'Eski Okul']);

        $response = $this->putJson("/api/schools/{$school->ulid}", [
            'name' => 'Güncellenmiş Okul',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Güncellenmiş Okul');

        $this->assertDatabaseHas('schools', ['id' => $school->id, 'name' => 'Güncellenmiş Okul']);
    }

    /** @test */
    public function update_baska_tenant_okulu_guncelleyemez(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->putJson("/api/schools/{$schoolB->ulid}", [
            'name' => 'Hack',
        ]);

        // Tenant scope ile model bulunamaz (404) veya policy 403
        $this->assertContains($response->status(), [403, 404]);
    }

    /** @test */
    public function update_auth_olmadan_401_doner(): void
    {
        $this->putJson('/api/schools/1', ['name' => 'Test'])->assertStatus(401);
    }

    // ─── DESTROY ───────────────────────────────────────────────────

    /** @test */
    public function destroy_okul_siler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->deleteJson("/api/schools/{$school->ulid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('schools', ['id' => $school->id, 'deleted_at' => null]);
    }

    /** @test */
    public function destroy_baska_tenant_okulu_silemez(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->deleteJson("/api/schools/{$schoolB->ulid}");

        $this->assertContains($response->status(), [403, 404]);

        // Okulun silinmediğini doğrula
        $this->assertDatabaseHas('schools', ['id' => $schoolB->id]);
    }

    /** @test */
    public function destroy_auth_olmadan_401_doner(): void
    {
        $this->deleteJson('/api/schools/1')->assertStatus(401);
    }
}
