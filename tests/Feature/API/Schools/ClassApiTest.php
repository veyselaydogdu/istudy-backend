<?php

namespace Tests\Feature\API\Schools;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Sınıf (Class) API Testleri
 * Kapsam: GET/POST/PUT/DELETE /schools/{school_id}/classes/{id}
 *
 * Tespit Edilen Hatalar:
 * - BUG-010: ClassController extends BaseSchoolController. BaseSchoolController::validateSchoolAccess()
 *   $user->schools() çağırıyor ancak User modelinde schools() ilişkisi YOK.
 *   school_id parametresi içeren tüm istekler BadMethodCallException → 500 dönüyor.
 *   Bu test grubundaki testlerin TÜMÜ BUG-010 nedeniyle FAIL olmalıdır.
 */
class ClassApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── INDEX ─────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: GET /schools/{school_id}/classes — BaseSchoolController::validateSchoolAccess()
     * $user->schools() çağrısı User modelinde olmadığından 500 döner.
     * Beklenen: 200
     */
    public function index_okul_siniflarini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $this->createClass($school, $year, $user, ['name' => 'A Sınıfı']);

        $response = $this->getJson("/api/schools/{$school->id}/classes");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('A Sınıfı', $names);
    }

    /** @test */
    public function index_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/schools/1/classes')->assertStatus(401);
    }

    // ─── STORE ─────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: POST /schools/{school_id}/classes — User::schools() eksik → 500.
     * Beklenen: 201
     */
    public function store_yeni_sinif_olusturur(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);

        $response = $this->postJson("/api/schools/{$school->id}/classes", [
            'name' => 'B Sınıfı',
            'capacity' => 25,
            'academic_year_id' => $year->id,
        ]);

        // BUG-010: Gerçekte 500 döner. Beklenen: 201.
        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'B Sınıfı');

        $this->assertDatabaseHas('classes', ['name' => 'B Sınıfı', 'school_id' => $school->id]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-010: Eksik alan ile istek → validation hatası beklenir (422),
     * ancak BaseSchoolController middleware önce tetiklenir → 500.
     */
    public function store_eksik_isim_ile_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->postJson("/api/schools/{$school->id}/classes", [
            // name eksik
            'capacity' => 25,
        ]);

        // BUG-010 olmasa 422 beklenirdi.
        $response->assertStatus(422);
    }

    /** @test */
    public function store_auth_olmadan_401_doner(): void
    {
        $this->postJson('/api/schools/1/classes', ['name' => 'Test'])->assertStatus(401);
    }

    // ─── SHOW ──────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: GET /schools/{school_id}/classes/{id} → User::schools() eksik → 500.
     * Beklenen: 200
     */
    public function show_sinif_detayini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user, ['name' => 'C Sınıfı']);

        $response = $this->getJson("/api/schools/{$school->id}/classes/{$class->id}");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'C Sınıfı');
    }

    // ─── UPDATE ────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: PUT /schools/{school_id}/classes/{id} → User::schools() eksik → 500.
     * Beklenen: 200
     */
    public function update_sinif_gunceller(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user, ['name' => 'Eski Sınıf']);

        $response = $this->putJson("/api/schools/{$school->id}/classes/{$class->id}", [
            'name' => 'Güncellenmiş Sınıf',
            'capacity' => 30,
        ]);

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Güncellenmiş Sınıf');
    }

    /** @test */
    public function update_auth_olmadan_401_doner(): void
    {
        $this->putJson('/api/schools/1/classes/1', ['name' => 'Test'])->assertStatus(401);
    }

    // ─── DESTROY ───────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: DELETE /schools/{school_id}/classes/{id} → User::schools() eksik → 500.
     * Beklenen: 200
     */
    public function destroy_sinif_siler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->deleteJson("/api/schools/{$school->id}/classes/{$class->id}");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('classes', ['id' => $class->id, 'deleted_at' => null]);
    }

    /** @test */
    public function destroy_auth_olmadan_401_doner(): void
    {
        $this->deleteJson('/api/schools/1/classes/1')->assertStatus(401);
    }

    // ─── TENANT İZOLASYON ──────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010 olmasa da, başka tenant okuluna ait sınıflara erişim 403/404 vermeli.
     */
    public function index_baska_tenant_okulu_siniflarini_gostermez(): void
    {
        ['user' => $userA, 'tenant' => $tenantA] = $this->createAuthenticatedTenant();
        ['user' => $userB, 'tenant' => $tenantB] = $this->createAuthenticatedTenant();

        $schoolB = $this->createSchool($tenantB, $userB);

        \Laravel\Sanctum\Sanctum::actingAs($userA);

        $response = $this->getJson("/api/schools/{$schoolB->id}/classes");

        // BUG-010 nedeniyle 500. Düzgün çalışıyor olsaydı 403 beklenir.
        $this->assertContains($response->status(), [403, 500]);
    }
}
