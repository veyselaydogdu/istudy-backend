<?php

namespace Tests\Feature\API\Schools;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Aktivite (Activity) API Testleri
 * Kapsam: GET/POST/PUT/DELETE /schools/{school_id}/activities/{id}
 *
 * Tespit Edilen Hatalar:
 * - BUG-010: ActivityController extends BaseSchoolController. school_id parametreli tüm
 *   istekler User::schools() eksikliğinden BadMethodCallException → 500 dönüyor.
 *   Bu test grubundaki testlerin büyük çoğunluğu BUG-010 nedeniyle FAIL olmalıdır.
 */
class ActivityApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── INDEX ─────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: GET /schools/{school_id}/activities → User::schools() eksik → 500.
     * Beklenen: 200
     */
    public function index_okul_aktivitelerini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->getJson("/api/schools/{$school->id}/activities");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function index_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/schools/1/activities')->assertStatus(401);
    }

    // ─── STORE ─────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: POST /schools/{school_id}/activities → User::schools() eksik → 500.
     * Beklenen: 201
     */
    public function store_yeni_aktivite_olusturur(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);

        $response = $this->postJson("/api/schools/{$school->id}/activities", [
            'name' => 'Resim Kursu',
            'academic_year_id' => $year->id,
            'start_date' => '2025-09-15',
            'end_date' => '2025-12-15',
        ]);

        // BUG-010: Gerçekte 500 döner. Beklenen: 201.
        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Resim Kursu');

        $this->assertDatabaseHas('activities', [
            'name' => 'Resim Kursu',
            'school_id' => $school->id,
        ]);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-010: Sınıf ataması ile aktivite oluşturma → 500.
     * Beklenen: 201, class_ids ile pivot kayıt oluşmalı.
     */
    public function store_sinif_atamasiyla_aktivite_olusturur(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->postJson("/api/schools/{$school->id}/activities", [
            'name' => 'Müzik Atölyesi',
            'academic_year_id' => $year->id,
            'class_ids' => [$class->id],
        ]);

        // BUG-010: Gerçekte 500 döner. Beklenen: 201.
        $response->assertStatus(201);
        $this->assertNotEmpty($response->json('data.classes'));
    }

    /** @test */
    public function store_eksik_isim_ile_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        // BUG-010 olmasa, school_id route param olmayan bir senaryoda validation 422 beklenir.
        // Ancak bu rota school_id içerdiğinden BUG-010 önce tetiklenir.
        $response = $this->postJson("/api/schools/{$school->id}/activities", [
            // name eksik
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function store_auth_olmadan_401_doner(): void
    {
        $this->postJson('/api/schools/1/activities', ['name' => 'Test'])->assertStatus(401);
    }

    // ─── SHOW ──────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: GET /schools/{school_id}/activities/{id} → User::schools() eksik → 500.
     * Beklenen: 200
     */
    public function show_aktivite_detayini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);

        // Aktiviteyi direkt oluştur (service'e gerek yok)
        $activity = \App\Models\Activity\Activity::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Bilim Kulübü',
            'created_by' => $user->id,
        ]);

        $response = $this->getJson("/api/schools/{$school->id}/activities/{$activity->id}");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Bilim Kulübü');
    }

    // ─── UPDATE ────────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: PUT /schools/{school_id}/activities/{id} → User::schools() eksik → 500.
     * Beklenen: 200
     */
    public function update_aktivite_gunceller(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);

        $activity = \App\Models\Activity\Activity::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Eski Aktivite',
            'created_by' => $user->id,
        ]);

        $response = $this->putJson("/api/schools/{$school->id}/activities/{$activity->id}", [
            'name' => 'Güncellenmiş Aktivite',
            'academic_year_id' => $year->id,
        ]);

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Güncellenmiş Aktivite');
    }

    /**
     * @test
     *
     * @group bug
     * BUG-010: Aktivite güncellerken class_ids sync de çalışmalı.
     */
    public function update_aktiviteye_sinif_atar(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $activity = \App\Models\Activity\Activity::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Spor Kulübü',
            'created_by' => $user->id,
        ]);

        $response = $this->putJson("/api/schools/{$school->id}/activities/{$activity->id}", [
            'name' => 'Spor Kulübü',
            'academic_year_id' => $year->id,
            'class_ids' => [$class->id],
        ]);

        // BUG-010: Gerçekte 500 döner. Beklenen: 200 + sınıf atanmış.
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data.classes'));
    }

    // ─── DESTROY ───────────────────────────────────────────────────

    /**
     * @test
     *
     * @group bug
     * BUG-010: DELETE /schools/{school_id}/activities/{id} → User::schools() eksik → 500.
     * Beklenen: 200
     */
    public function destroy_aktivite_siler(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);

        $activity = \App\Models\Activity\Activity::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'academic_year_id' => $year->id,
            'name' => 'Silinecek Aktivite',
            'created_by' => $user->id,
        ]);

        $response = $this->deleteJson("/api/schools/{$school->id}/activities/{$activity->id}");

        // BUG-010: Gerçekte 500 döner. Beklenen: 200.
        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('activities', ['id' => $activity->id, 'deleted_at' => null]);
    }

    /** @test */
    public function destroy_auth_olmadan_401_doner(): void
    {
        $this->deleteJson('/api/schools/1/activities/1')->assertStatus(401);
    }
}
