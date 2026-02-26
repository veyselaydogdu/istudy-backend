<?php

namespace Tests\Feature\API\Meals;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Tenant Allerjen API Testleri
 * Kapsam: GET /allergens, POST /allergens, PUT /allergens/{id}, DELETE /allergens/{id}
 *
 * Tespit Edilen Hatalar:
 * - BUG-001: index() — BaseModel global scope (WHERE tenant_id = X), orWhereNull() ile birleşince
 *             global allerjenler (tenant_id=null) hiç dönmüyor.
 * - BUG-004: update/destroy — firstOrFail() catch içinde → 500 döner, beklenen: 404
 */
class TenantAllergenApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── INDEX ─────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-001: Global allerjenler (tenant_id=null) BaseModel global scope nedeniyle
     * listeleme sırasında WHERE tenant_id = X filtresi tarafından elendiğinden
     * response'a dahil edilmez. Bu test mevcut haliyle FAIL olmalıdır.
     */
    public function index_global_allerjenler_listede_gorulmeli(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();

        $globalAllergen = $this->createGlobalAllergen($user);
        $tenantAllergen = $this->createTenantAllergen($tenant, $user);

        $response = $this->getJson('/api/allergens');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $ids = collect($response->json('data'))->pluck('id')->toArray();

        // Global allerjen döndürülmeli (BUG-001 nedeniyle bu FAIL olur)
        $this->assertContains($globalAllergen->id, $ids,
            'BUG-001: Global allerjen (tenant_id=null) listede görünmüyor.'
        );
        // Tenant allerjen döndürülmeli
        $this->assertContains($tenantAllergen->id, $ids);
    }

    /** @test */
    public function index_tenant_allerjenlerini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();

        $tenantAllergen = $this->createTenantAllergen($tenant, $user);

        $response = $this->getJson('/api/allergens');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($tenantAllergen->id, $ids);
    }

    /**
     * @test
     * Başka tenant'ın allerjenlerini index'te görmemeli.
     */
    public function index_baska_tenant_allerjenini_gostermez(): void
    {
        ['user' => $userA, 'tenant' => $tenantA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $otherAllergen = $this->createTenantAllergen($tenantB, $userB);

        // Tenant A olarak giriş yap (createAuthenticatedTenant son çağrıyı aktif yapar,
        // bu yüzden tenant A için tekrar aktif edeceğiz)
        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->getJson('/api/allergens');

        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertNotContains($otherAllergen->id, $ids);
    }

    /** @test */
    public function index_auth_olmadan_401_doner(): void
    {
        $response = $this->getJson('/api/allergens');

        $response->assertStatus(401);
    }

    // ─── STORE ─────────────────────────────────────────────────────

    /** @test */
    public function store_gecerli_veri_ile_allerjen_olusturur(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->postJson('/api/allergens', [
            'name' => 'Gluten',
            'description' => 'Buğdayda bulunur',
            'risk_level' => 'high',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Gluten')
            ->assertJsonPath('data.risk_level', 'high');

        $this->assertDatabaseHas('allergens', ['name' => 'Gluten']);
    }

    /** @test */
    public function store_tenant_id_otomatik_atanir(): void
    {
        ['tenant' => $tenant] = $this->createAuthenticatedTenant();

        $this->postJson('/api/allergens', [
            'name' => 'Süt',
            'risk_level' => 'medium',
        ])->assertStatus(201);

        $this->assertDatabaseHas('allergens', [
            'name' => 'Süt',
            'tenant_id' => $tenant->id,
        ]);
    }

    /** @test */
    public function store_eksik_isim_ile_422_doner(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->postJson('/api/allergens', [
            'risk_level' => 'high',
            // name eksik
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function store_gecersiz_risk_level_ile_422_doner(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->postJson('/api/allergens', [
            'name' => 'Test',
            'risk_level' => 'extreme', // geçersiz değer
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function store_auth_olmadan_401_doner(): void
    {
        $response = $this->postJson('/api/allergens', [
            'name' => 'Test',
        ]);

        $response->assertStatus(401);
    }

    // ─── UPDATE ────────────────────────────────────────────────────

    /** @test */
    public function update_kendi_allerjenini_gunceller(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $allergen = $this->createTenantAllergen($tenant, $user, ['name' => 'Eski İsim']);

        $response = $this->putJson("/api/allergens/{$allergen->id}", [
            'name' => 'Yeni İsim',
            'risk_level' => 'low',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Yeni İsim');

        $this->assertDatabaseHas('allergens', ['id' => $allergen->id, 'name' => 'Yeni İsim']);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-004: Global allerjen güncellenmeye çalışıldığında firstOrFail() ModelNotFoundException
     * fırlatır, bu catch(\Throwable) tarafından yakalanır ve 500 döner.
     * Beklenen davranış: 404 Not Found.
     */
    public function update_global_allerjen_guncellenemez_404_beklenir(): void
    {
        ['user' => $user] = $this->createAuthenticatedTenant();
        $globalAllergen = $this->createGlobalAllergen($user);

        $response = $this->putJson("/api/allergens/{$globalAllergen->id}", [
            'name' => 'Değiştirilmiş',
            'risk_level' => 'low',
        ]);

        // BUG-004: Gerçekte 500 döner. Beklenen: 404.
        $response->assertStatus(404);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-004: Başka tenanta ait allerjen güncellenmeye çalışıldığında
     * firstOrFail() catch içinde → 500 döner. Beklenen: 404.
     */
    public function update_baska_tenant_allerjenini_guncelleyemez_404_beklenir(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();
        $otherAllergen = $this->createTenantAllergen($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->putJson("/api/allergens/{$otherAllergen->id}", [
            'name' => 'Hack',
            'risk_level' => 'low',
        ]);

        // BUG-004: Gerçekte 500 döner. Beklenen: 404.
        $response->assertStatus(404);
    }

    /** @test */
    public function update_eksik_isim_ile_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $allergen = $this->createTenantAllergen($tenant, $user);

        $response = $this->putJson("/api/allergens/{$allergen->id}", [
            // name eksik
            'risk_level' => 'low',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function update_auth_olmadan_401_doner(): void
    {
        $response = $this->putJson('/api/allergens/1', ['name' => 'Test']);

        $response->assertStatus(401);
    }

    // ─── DESTROY ───────────────────────────────────────────────────

    /** @test */
    public function destroy_kendi_allerjenini_siler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $allergen = $this->createTenantAllergen($tenant, $user);

        $response = $this->deleteJson("/api/allergens/{$allergen->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('allergens', ['id' => $allergen->id, 'deleted_at' => null]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-004: Global allerjen silinmeye çalışıldığında firstOrFail() ModelNotFoundException
     * fırlatır, catch(\Throwable) tarafından yakalanır, 500 döner.
     * Beklenen davranış: 404 Not Found.
     */
    public function destroy_global_allerjen_silinemez_404_beklenir(): void
    {
        ['user' => $user] = $this->createAuthenticatedTenant();
        $globalAllergen = $this->createGlobalAllergen($user);

        $response = $this->deleteJson("/api/allergens/{$globalAllergen->id}");

        // BUG-004: Gerçekte 500 döner. Beklenen: 404.
        $response->assertStatus(404);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-004: Başka tenanta ait allerjen silinmeye çalışıldığında
     * firstOrFail() catch içinde → 500 döner. Beklenen: 404.
     */
    public function destroy_baska_tenant_allerjenini_silemez_404_beklenir(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();
        $otherAllergen = $this->createTenantAllergen($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->deleteJson("/api/allergens/{$otherAllergen->id}");

        // BUG-004: Gerçekte 500 döner. Beklenen: 404.
        $response->assertStatus(404);
    }

    /** @test */
    public function destroy_olmayan_allerjen_404_doner(): void
    {
        $this->createAuthenticatedTenant();

        // ID 9999 ile var olmayan allerjen
        $response = $this->deleteJson('/api/allergens/9999');

        // BUG-004 burada da geçerli: 500 dönecek, beklenen 404.
        $response->assertStatus(404);
    }

    /** @test */
    public function destroy_auth_olmadan_401_doner(): void
    {
        $response = $this->deleteJson('/api/allergens/1');

        $response->assertStatus(401);
    }
}
