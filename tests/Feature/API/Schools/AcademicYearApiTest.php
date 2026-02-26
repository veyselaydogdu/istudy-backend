<?php

namespace Tests\Feature\API\Schools;

use App\Models\Academic\AcademicYear;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Eğitim Yılı (AcademicYear) API Testleri
 * Kapsam: GET/POST/PUT/DELETE/PATCH /academic-years/*
 *
 * Tespit Edilen Hatalar:
 * - BUG-007: store/update/transition/addClass — validate() try-catch içinde →
 *            ValidationException catch(\Throwable) tarafından yakalanır → 500, beklenen: 422.
 * - BUG-008: store/update — $request->all() kullanılıyor, beklenen: $request->validated().
 *            Bu güvenlik açığı değil ama convention ihlali.
 * - BUG-009: index — AcademicYearResource::collection($years)->resource paginatedResponse'a
 *            geçirildiğinde items Resource üzerinden dönmüyor, ham model verisi dönüyor.
 * - BUG-010: AcademicYearController extends BaseSchoolController. school_id içeren
 *            isteklerde User::schools() eksik → 500.
 */
class AcademicYearApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── INDEX ─────────────────────────────────────────────────────

    /** @test */
    public function index_school_id_olmadan_422_doner(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->getJson('/api/academic-years');

        $response->assertStatus(422)
            ->assertJson(['success' => false]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-010: GET /academic-years?school_id=X — BaseSchoolController middleware
     * User::schools() çağırır → BadMethodCallException → 500.
     * Beklenen: 200 (paginated list)
     *
     * BUG-009: Response data items AcademicYearResource üzerinden geçmiyor.
     */
    public function index_egitim_yillarini_listeler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user, ['name' => '2025-2026']);

        $response = $this->getJson("/api/academic-years?school_id={$school->id}");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data', 'meta']);

        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('2025-2026', $names);
    }

    /** @test */
    public function index_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/academic-years?school_id=1')->assertStatus(401);
    }

    // ─── STORE ─────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: POST /academic-years body'de school_id var → BaseSchoolController middleware
     * User::schools() → BadMethodCallException → 500. Beklenen: 201.
     */
    public function store_yeni_egitim_yili_olusturur(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->postJson('/api/academic-years', [
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
        ]);

        // BUG-010: Gerçekte 500 döner. Beklenen: 201.
        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('academic_years', [
            'school_id' => $school->id,
            'name' => '2025-2026',
        ]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-007: validate() try-catch içinde. Eksik alan ile istek gelince
     * ValidationException catch(\Throwable) yakalanır → 500 döner.
     * Beklenen: 422.
     *
     * NOT: Bu test önce BUG-010 nedeniyle 500 verecek, BUG-010 düzeldikten sonra
     * da BUG-007 nedeniyle 500 verecek. İkisi birlikte düzelince 422 verecek.
     */
    public function store_eksik_alan_ile_422_beklenir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->postJson('/api/academic-years', [
            'school_id' => $school->id,
            // name, start_date, end_date eksik
        ]);

        // BUG-007 + BUG-010: Gerçekte 500 döner. Beklenen: 422.
        $response->assertStatus(422);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-007: Geçersiz tarih formatı ile istek → validate() catch içinde → 500.
     * Beklenen: 422.
     */
    public function store_gecersiz_tarih_ile_422_beklenir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->postJson('/api/academic-years', [
            'school_id' => $school->id,
            'name' => '2025-2026',
            'start_date' => 'gecersiz-tarih',
            'end_date' => '2026-06-30',
        ]);

        // BUG-007 + BUG-010: Gerçekte 500 döner. Beklenen: 422.
        $response->assertStatus(422);
    }

    /** @test */
    public function store_auth_olmadan_401_doner(): void
    {
        $this->postJson('/api/academic-years', [
            'school_id' => 1,
            'name' => 'Test',
        ])->assertStatus(401);
    }

    // ─── SHOW ──────────────────────────────────────────────────────

    /**
     * @test
     * AcademicYear show route'unda school_id parametresi gönderilmez.
     * BUG-010 bu rota için tetiklenmez (sadece show/{id}).
     */
    public function show_egitim_yili_detayini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user, ['name' => 'Detay Yılı']);

        $response = $this->getJson("/api/academic-years/{$year->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function show_olmayan_egitim_yili_404_doner(): void
    {
        $this->createAuthenticatedTenant();

        $response = $this->getJson('/api/academic-years/9999');

        $response->assertStatus(404);
    }

    // ─── UPDATE ────────────────────────────────────────────────────

    /**
     * @test
     * UPDATE route school_id gerektirmez (sadece {academicYear} model binding).
     * BUG-007 update için de geçerli (validate() try-catch içinde).
     */
    public function update_egitim_yili_gunceller(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user, ['name' => 'Eski Yıl']);

        $response = $this->putJson("/api/academic-years/{$year->id}", [
            'name' => 'Güncellenmiş Yıl',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('academic_years', [
            'id' => $year->id,
            'name' => 'Güncellenmiş Yıl',
        ]);
    }

    /** @test */
    public function update_auth_olmadan_401_doner(): void
    {
        $this->putJson('/api/academic-years/1', ['name' => 'Test'])->assertStatus(401);
    }

    // ─── DESTROY ───────────────────────────────────────────────────

    /** @test */
    public function destroy_aktif_olmayan_egitim_yilini_siler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user, ['is_current' => false]);

        $response = $this->deleteJson("/api/academic-years/{$year->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('academic_years', ['id' => $year->id, 'deleted_at' => null]);
    }

    /** @test */
    public function destroy_aktif_egitim_yili_silinemez(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user, ['is_current' => true]);

        $response = $this->deleteJson("/api/academic-years/{$year->id}");

        $response->assertStatus(422)
            ->assertJson(['success' => false]);

        $this->assertDatabaseHas('academic_years', ['id' => $year->id]);
    }

    /** @test */
    public function destroy_auth_olmadan_401_doner(): void
    {
        $this->deleteJson('/api/academic-years/1')->assertStatus(401);
    }

    // ─── SET-CURRENT ───────────────────────────────────────────────

    /**
     * @test
     * PATCH /academic-years/{id}/set-current — school_id parametresi yok.
     * BUG-010 tetiklenmez.
     */
    public function set_current_egitim_yilini_aktif_yapar(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user, ['is_current' => false]);

        $response = $this->patchJson("/api/academic-years/{$year->id}/set-current");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('academic_years', ['id' => $year->id, 'is_current' => true]);
    }

    // ─── CLOSE ─────────────────────────────────────────────────────

    /**
     * @test
     * PATCH /academic-years/{id}/close — school_id parametresi yok.
     * BUG-010 tetiklenmez.
     */
    public function close_egitim_yilini_kapatir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user, ['is_active' => true]);

        $response = $this->patchJson("/api/academic-years/{$year->id}/close");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    // ─── TRANSITION ────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-007: transition() validate() try-catch içinde.
     * BUG-010: body'de school_id var → User::schools() → 500.
     * Beklenen: 201
     */
    public function transition_yeni_egitim_yiline_gecis_yapar(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $this->createAcademicYear($school, $user, ['is_current' => true, 'is_active' => true]);

        $response = $this->postJson('/api/academic-years/transition', [
            'school_id' => $school->id,
            'name' => '2026-2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'copy_classes' => false,
        ]);

        // BUG-007 + BUG-010: Gerçekte 500 döner. Beklenen: 201.
        $response->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-007 testi: transition eksik alan ile → 500, beklenen 422.
     */
    public function transition_eksik_alan_ile_422_beklenir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->postJson('/api/academic-years/transition', [
            'school_id' => $school->id,
            // name, start_date, end_date eksik
        ]);

        // BUG-007: Gerçekte 500 döner. Beklenen: 422.
        $response->assertStatus(422);
    }

    // ─── CURRENT ───────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: GET /academic-years/current?school_id=X → User::schools() → 500.
     */
    public function current_aktif_egitim_yilini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $this->createAcademicYear($school, $user, ['is_current' => true, 'name' => 'Aktif Yıl']);

        $response = $this->getJson("/api/academic-years/current?school_id={$school->id}");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function current_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/academic-years/current?school_id=1')->assertStatus(401);
    }
}
