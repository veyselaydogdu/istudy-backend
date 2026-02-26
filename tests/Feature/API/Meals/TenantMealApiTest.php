<?php

namespace Tests\Feature\API\Meals;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Tenant Yemek & Besin Öğesi API Testleri
 * Kapsam: /food-ingredients (CRUD), /meals (CRUD)
 *
 * Tespit Edilen Hatalar:
 * - BUG-002: ingredientIndex() — BaseModel global scope nedeniyle global besin öğeleri (tenant_id=null) dönmüyor.
 * - BUG-003: mealUpdate/mealDestroy — Meal::findOrFail($id) tenant filtresi olmadan; başka tenant'ın yemeğini günceller/siler.
 * - BUG-005: ingredientUpdate/ingredientDestroy — firstOrFail() catch içinde → 500, beklenen: 404.
 * - BUG-006: mealIndex — validate() try-catch içinde → ValidationException yakalanır → 500, beklenen: 422.
 */
class TenantMealApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── BESİN ÖĞELERİ INDEX ──────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-002: Global besin öğeleri (tenant_id=null) BaseModel global scope nedeniyle
     * listeleme sırasında WHERE tenant_id = X ile elendiğinden dönmüyor.
     * Bu test mevcut haliyle FAIL olmalıdır.
     */
    public function ingredient_index_global_besin_ogeleri_gorulmeli(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();

        $globalIngredient = $this->createGlobalIngredient($user);
        $tenantIngredient = $this->createTenantIngredient($tenant, $user);

        $response = $this->getJson('/api/food-ingredients');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $ids = collect($response->json('data'))->pluck('id')->toArray();

        // Global besin öğesi dönmeli (BUG-002 nedeniyle FAIL olur)
        $this->assertContains($globalIngredient->id, $ids,
            'BUG-002: Global besin öğesi (tenant_id=null) listede görünmüyor.'
        );
        $this->assertContains($tenantIngredient->id, $ids);
    }

    /** @test */
    public function ingredient_index_tenant_besin_ogelerini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();

        $tenantIngredient = $this->createTenantIngredient($tenant, $user);

        $response = $this->getJson('/api/food-ingredients');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($tenantIngredient->id, $ids);
    }

    /** @test */
    public function ingredient_index_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/food-ingredients')->assertStatus(401);
    }

    // ─── BESİN ÖĞESİ STORE ─────────────────────────────────────────

    /** @test */
    public function ingredient_store_yeni_besin_ogesi_olusturur(): void
    {
        ['tenant' => $tenant] = $this->createAuthenticatedTenant();

        $response = $this->postJson('/api/food-ingredients', [
            'name' => 'Domates',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Domates')
            ->assertJsonPath('data.is_custom', true);

        $this->assertDatabaseHas('food_ingredients', [
            'name' => 'Domates',
            'tenant_id' => $tenant->id,
        ]);
    }

    /** @test */
    public function ingredient_store_allerjen_idleri_ile_allerjenler_atanir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();

        $allergen = $this->createGlobalAllergen($user);

        $response = $this->postJson('/api/food-ingredients', [
            'name' => 'Ekmek',
            'allergen_ids' => [$allergen->id],
        ]);

        $response->assertStatus(201);
        $this->assertNotEmpty($response->json('data.allergens'));
    }

    /** @test */
    public function ingredient_store_eksik_isim_ile_422_doner(): void
    {
        $this->createAuthenticatedTenant();

        $this->postJson('/api/food-ingredients', [])->assertStatus(422);
    }

    /** @test */
    public function ingredient_store_auth_olmadan_401_doner(): void
    {
        $this->postJson('/api/food-ingredients', ['name' => 'Test'])->assertStatus(401);
    }

    // ─── BESİN ÖĞESİ UPDATE ────────────────────────────────────────

    /** @test */
    public function ingredient_update_kendi_tenant_besinini_gunceller(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $ingredient = $this->createTenantIngredient($tenant, $user, ['name' => 'Eski']);

        $response = $this->putJson("/api/food-ingredients/{$ingredient->id}", [
            'name' => 'Yeni',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Yeni');
    }

    /**
     * @test
     *
     * @group bug
     * BUG-005: Global besin öğesi güncellenmeye çalışıldığında firstOrFail() ModelNotFoundException
     * fırlatır, catch(\Throwable) 500 döner. Beklenen: 404.
     */
    public function ingredient_update_global_besin_ogesi_guncellenemez_404_beklenir(): void
    {
        ['user' => $user] = $this->createAuthenticatedTenant();
        $globalIngredient = $this->createGlobalIngredient($user);

        $response = $this->putJson("/api/food-ingredients/{$globalIngredient->id}", [
            'name' => 'Değiştirildi',
        ]);

        // BUG-005: Gerçekte 500 döner. Beklenen: 404.
        $response->assertStatus(404);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-005: Başka tenanta ait besin öğesi güncellenmeye çalışıldığında
     * firstOrFail() catch içinde → 500 döner. Beklenen: 404.
     */
    public function ingredient_update_baska_tenant_besini_guncelleyemez(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();
        $otherIngredient = $this->createTenantIngredient($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->putJson("/api/food-ingredients/{$otherIngredient->id}", [
            'name' => 'Hack',
        ]);

        // BUG-005: Gerçekte 500 döner. Beklenen: 404.
        $response->assertStatus(404);
    }

    /** @test */
    public function ingredient_update_eksik_isim_ile_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $ingredient = $this->createTenantIngredient($tenant, $user);

        $this->putJson("/api/food-ingredients/{$ingredient->id}", [])->assertStatus(422);
    }

    // ─── BESİN ÖĞESİ DESTROY ───────────────────────────────────────

    /** @test */
    public function ingredient_destroy_kendi_tenant_besinini_siler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $ingredient = $this->createTenantIngredient($tenant, $user);

        $response = $this->deleteJson("/api/food-ingredients/{$ingredient->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('food_ingredients', ['id' => $ingredient->id, 'deleted_at' => null]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-005: Global besin öğesi silinmeye çalışıldığında firstOrFail() catch içinde → 500.
     * Beklenen: 404.
     */
    public function ingredient_destroy_global_besin_ogesi_silinemez_404_beklenir(): void
    {
        ['user' => $user] = $this->createAuthenticatedTenant();
        $globalIngredient = $this->createGlobalIngredient($user);

        $response = $this->deleteJson("/api/food-ingredients/{$globalIngredient->id}");

        // BUG-005: Gerçekte 500 döner. Beklenen: 404.
        $response->assertStatus(404);
    }

    // ─── YEMEK INDEX ───────────────────────────────────────────────

    /** @test */
    public function meal_index_okul_yemeklerini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $this->createMeal($school, $user, ['name' => 'Mercimek Çorbası']);

        $response = $this->getJson("/api/meals?school_id={$school->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('Mercimek Çorbası', $names);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-006: mealIndex() içinde validate() try-catch içinde çağrılıyor.
     * school_id olmadan istek gelince ValidationException catch(\Throwable) tarafından yakalanıp
     * 500 dönüyor. Beklenen: 422.
     */
    public function meal_index_school_id_olmadan_422_beklenir(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->getJson('/api/meals');

        // BUG-006: Gerçekte 500 döner. Beklenen: 422.
        $response->assertStatus(422);
    }

    /** @test */
    public function meal_index_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/meals?school_id=1')->assertStatus(401);
    }

    // ─── YEMEK STORE ───────────────────────────────────────────────

    /** @test */
    public function meal_store_yeni_yemek_olusturur(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);

        $response = $this->postJson('/api/meals', [
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Sebzeli Pirinç Pilavı',
            'meal_type' => 'lunch',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Sebzeli Pirinç Pilavı');

        $this->assertDatabaseHas('meals', [
            'school_id' => $school->id,
            'name' => 'Sebzeli Pirinç Pilavı',
        ]);
    }

    /** @test */
    public function meal_store_malzeme_atamasiyla_yemek_olusturur(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $ingredient = $this->createTenantIngredient($tenant, $user);

        $response = $this->postJson('/api/meals', [
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Test Yemeği',
            'meal_type' => 'breakfast',
            'ingredient_ids' => [$ingredient->id],
        ]);

        $response->assertStatus(201);
        $this->assertNotEmpty($response->json('data.ingredients'));
    }

    /** @test */
    public function meal_store_eksik_alan_ile_422_doner(): void
    {
        $this->createAuthenticatedTenant();

        $this->postJson('/api/meals', [
            // school_id ve name eksik
        ])->assertStatus(422);
    }

    // ─── YEMEK UPDATE ──────────────────────────────────────────────

    /** @test */
    public function meal_update_kendi_yemegini_gunceller(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $meal = $this->createMeal($school, $user, ['name' => 'Eski Yemek']);

        $response = $this->putJson("/api/meals/{$meal->id}", [
            'name' => 'Yeni Yemek',
            'meal_type' => 'dinner',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Yeni Yemek');
    }

    /**
     * @test
     *
     * @group bug
     * BUG-003: Meal::findOrFail($id) tenant filtresi olmadan kullanılıyor.
     * Meal modeli tenant_id içermediğinden global scope uygulanmıyor.
     * Başka bir tenant'ın yemeğini güncelleyebilmek GÜVENLİK AÇIĞIDIR.
     * Bu test geçmemeli (yani başka tenant yemeği güncellenmemeli, ama BUG ile güncelleniyor).
     */
    public function meal_update_baska_tenant_yemegini_guncelleyemez(): void
    {
        ['user' => $userA, 'tenant' => $tenantA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);
        $mealB = $this->createMeal($schoolB, $userB, ['name' => 'B Yemeği']);

        // Tenant A olarak giriş yap
        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->putJson("/api/meals/{$mealB->id}", [
            'name' => 'A Tarafından Değiştirildi',
            'meal_type' => 'lunch',
        ]);

        // BUG-003: Başka tenantın yemeğini güncelleyebiliyor (güvenlik açığı).
        // Beklenen davranış: 403 veya 404
        $response->assertStatus(403);
    }

    /** @test */
    public function meal_update_eksik_isim_ile_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $meal = $this->createMeal($school, $user);

        $this->putJson("/api/meals/{$meal->id}", [
            // name eksik
            'meal_type' => 'lunch',
        ])->assertStatus(422);
    }

    // ─── YEMEK DESTROY ─────────────────────────────────────────────

    /** @test */
    public function meal_destroy_kendi_yemegini_siler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $meal = $this->createMeal($school, $user);

        $response = $this->deleteJson("/api/meals/{$meal->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('meals', ['id' => $meal->id, 'deleted_at' => null]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-003: Başka tenant'ın yemeğini silebilmek GÜVENLİK AÇIĞIDIR.
     * Bu test geçmemeli, ancak mevcut haliyle geçecek.
     */
    public function meal_destroy_baska_tenant_yemegini_silemez(): void
    {
        ['user' => $userA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);
        $mealB = $this->createMeal($schoolB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->deleteJson("/api/meals/{$mealB->id}");

        // BUG-003: Başka tenantın yemeğini siliyor (güvenlik açığı).
        // Beklenen: 403 veya 404
        $response->assertStatus(403);
    }

    /** @test */
    public function meal_destroy_olmayan_yemek_404_doner(): void
    {
        $this->createAuthenticatedTenant();

        $this->deleteJson('/api/meals/9999')->assertStatus(404);
    }

    /** @test */
    public function meal_destroy_auth_olmadan_401_doner(): void
    {
        $this->deleteJson('/api/meals/1')->assertStatus(401);
    }
}
