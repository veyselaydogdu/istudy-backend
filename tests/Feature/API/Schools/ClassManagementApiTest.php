<?php

namespace Tests\Feature\API\Schools;

use App\Models\Activity\Material;
use App\Models\School\TeacherProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\ApiTestHelpers;

/**
 * Sınıf Yönetimi API Testleri
 * Kapsam:
 *   - GET/POST/DELETE /schools/{school_id}/classes/{class_id}/teachers
 *   - GET/POST/PUT/DELETE /schools/{school_id}/classes/{class_id}/supply-list
 *   - GET /schools/{school_id}/teachers
 *
 * Tespit Edilen Hatalar:
 * - BUG-011: ClassManagementController::assignTeacher — hata mesajında $e->getMessage() client'a
 *            iletiliyor: 'Atama başarısız: '.$e->getMessage(). İç hata detayları sızıyor.
 * - Ek: classTeachers/removeTeacher/updateSupplyItem/deleteSupplyItem — firstOrFail() catch içinde
 *       → 500, beklenen: 404.
 *
 * Not: ClassManagementController extends BaseController (BaseSchoolController DEĞİL),
 * Bu nedenle BUG-010 (User::schools()) bu controller için GEÇERLİ DEĞİL.
 */
class ClassManagementApiTest extends TestCase
{
    use ApiTestHelpers, RefreshDatabase;

    // ─── ÖĞRETMEN LİSTESİ ──────────────────────────────────────────

    /** @test */
    public function school_teachers_okulun_ogretmenlerini_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        // Okul öğretmeni oluştur
        TeacherProfile::withoutGlobalScopes()->create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'title' => 'Öğretmen',
            'created_by' => $user->id,
        ]);

        $response = $this->getJson("/api/schools/{$school->id}/teachers");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function school_teachers_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/schools/1/teachers')->assertStatus(401);
    }

    // ─── SINIF ÖĞRETMENLERİ ────────────────────────────────────────

    /** @test */
    public function class_teachers_sinifa_atanmis_ogretmenleri_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->getJson("/api/schools/{$school->id}/classes/{$class->id}/teachers");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /**
     * @test
     *
     * @group bug
     * Var olmayan sınıf için öğretmen listesi → firstOrFail() catch içinde → 500.
     * Beklenen: 404 (ModelNotFoundException → 404).
     */
    public function class_teachers_olmayan_sinif_404_beklenir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);

        $response = $this->getJson("/api/schools/{$school->id}/classes/9999/teachers");

        // firstOrFail() catch içinde → 500. Beklenen: 404.
        $response->assertStatus(404);
    }

    /** @test */
    public function class_teachers_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/schools/1/classes/1/teachers')->assertStatus(401);
    }

    // ─── ÖĞRETMEN ATAMA ────────────────────────────────────────────

    /** @test */
    public function assign_teacher_sinifa_ogretmen_atar(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $teacher = TeacherProfile::withoutGlobalScopes()->create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'title' => 'Sınıf Öğretmeni',
            'created_by' => $user->id,
        ]);

        $response = $this->postJson("/api/schools/{$school->id}/classes/{$class->id}/teachers", [
            'teacher_profile_id' => $teacher->id,
            'role' => 'head_teacher',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        // Pivot tablosuna kayıt eklendi mi?
        $this->assertDatabaseHas('class_teacher_assignments', [
            'class_id' => $class->id,
            'teacher_profile_id' => $teacher->id,
        ]);
    }

    /** @test */
    public function assign_teacher_gecersiz_role_ile_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $teacher = TeacherProfile::withoutGlobalScopes()->create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'title' => 'Öğretmen',
            'created_by' => $user->id,
        ]);

        $response = $this->postJson("/api/schools/{$school->id}/classes/{$class->id}/teachers", [
            'teacher_profile_id' => $teacher->id,
            'role' => 'gecersiz_rol', // geçersiz
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function assign_teacher_eksik_alan_ile_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->postJson("/api/schools/{$school->id}/classes/{$class->id}/teachers", [
            // teacher_profile_id eksik
        ]);

        $response->assertStatus(422);
    }

    /**
     * @test
     *
     * @group bug
     * BUG-011: assignTeacher catch bloğunda 'Atama başarısız: '.$e->getMessage() ile
     * iç hata detayları client'a iletiliyor. Güvenlik açığı.
     * Bu test $e->getMessage() içeriğinin response body'de OLMAMASI gerektiğini kontrol eder.
     */
    public function assign_teacher_hata_mesajinda_ic_hata_detayi_sizdirmiyor(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        // Var olmayan teacher_profile_id → firstOrFail() → ModelNotFoundException
        $response = $this->postJson("/api/schools/{$school->id}/classes/{$class->id}/teachers", [
            'teacher_profile_id' => 9999,
        ]);

        // BUG-011: Response message "Atama başarısız: No query results for model..." içeriyor.
        // Beklenen davranış: Sadece genel hata mesajı döner, detay sızdırılmaz.
        $message = $response->json('message') ?? '';
        $this->assertStringNotContainsString('No query results', $message,
            'BUG-011: İç hata mesajı (Exception message) client\'a sızdırılıyor.'
        );
    }

    // ─── ÖĞRETMEN ÇIKARMA ──────────────────────────────────────────

    /** @test */
    public function remove_teacher_siniftan_ogretmeni_cikarir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $teacher = TeacherProfile::withoutGlobalScopes()->create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'title' => 'Öğretmen',
            'created_by' => $user->id,
        ]);

        // Önce ata
        $class->teachers()->syncWithoutDetaching([$teacher->id => ['role' => 'head_teacher']]);

        $response = $this->deleteJson("/api/schools/{$school->id}/classes/{$class->id}/teachers/{$teacher->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('class_teacher_assignments', [
            'class_id' => $class->id,
            'teacher_profile_id' => $teacher->id,
        ]);
    }

    /** @test */
    public function remove_teacher_auth_olmadan_401_doner(): void
    {
        $this->deleteJson('/api/schools/1/classes/1/teachers/1')->assertStatus(401);
    }

    // ─── İHTİYAÇ LİSTESİ (SUPPLY LIST) ────────────────────────────

    /** @test */
    public function supply_list_bos_liste_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->getJson("/api/schools/{$school->id}/classes/{$class->id}/supply-list");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'data' => []]);
    }

    /** @test */
    public function supply_list_kalem_ekle(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->postJson("/api/schools/{$school->id}/classes/{$class->id}/supply-list", [
            'name' => 'Boyama Kalemi',
            'quantity' => 12,
            'due_date' => '2025-09-15',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Boyama Kalemi')
            ->assertJsonPath('data.quantity', 12);

        $this->assertDatabaseHas('materials', [
            'name' => 'Boyama Kalemi',
            'school_id' => $school->id,
            'class_id' => $class->id,
        ]);
    }

    /** @test */
    public function supply_list_kalem_ekle_eksik_isim_422_doner(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->postJson("/api/schools/{$school->id}/classes/{$class->id}/supply-list", [
            // name eksik
            'quantity' => 5,
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function supply_list_kalem_guncelle(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $material = Material::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'academic_year_id' => $year->id,
            'name' => 'Eski Kalem',
            'quantity' => 5,
            'created_by' => $user->id,
        ]);

        $response = $this->putJson(
            "/api/schools/{$school->id}/classes/{$class->id}/supply-list/{$material->id}",
            [
                'name' => 'Güncellenmiş Kalem',
                'quantity' => 10,
            ]
        );

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.name', 'Güncellenmiş Kalem');
    }

    /**
     * @test
     *
     * @group bug
     * Var olmayan materyal güncellenmek istendiğinde firstOrFail() catch içinde → 500.
     * Beklenen: 404.
     */
    public function supply_list_olmayan_kalem_guncelleme_404_beklenir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->putJson(
            "/api/schools/{$school->id}/classes/{$class->id}/supply-list/9999",
            ['name' => 'Test', 'quantity' => 1]
        );

        // firstOrFail() catch içinde → 500. Beklenen: 404.
        $response->assertStatus(404);
    }

    /** @test */
    public function supply_list_kalem_sil(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $material = Material::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'academic_year_id' => $year->id,
            'name' => 'Silinecek Kalem',
            'quantity' => 1,
            'created_by' => $user->id,
        ]);

        $response = $this->deleteJson(
            "/api/schools/{$school->id}/classes/{$class->id}/supply-list/{$material->id}"
        );

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('materials', ['id' => $material->id, 'deleted_at' => null]);
    }

    /**
     * @test
     *
     * @group bug
     * Var olmayan materyal silinmek istendiğinde firstOrFail() catch içinde → 500.
     * Beklenen: 404.
     */
    public function supply_list_olmayan_kalem_silme_404_beklenir(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createAuthenticatedTenant();
        $school = $this->createSchool($tenant, $user);
        $year = $this->createAcademicYear($school, $user);
        $class = $this->createClass($school, $year, $user);

        $response = $this->deleteJson(
            "/api/schools/{$school->id}/classes/{$class->id}/supply-list/9999"
        );

        // firstOrFail() catch içinde → 500. Beklenen: 404.
        $response->assertStatus(404);
    }

    /** @test */
    public function supply_list_auth_olmadan_401_doner(): void
    {
        $this->getJson('/api/schools/1/classes/1/supply-list')->assertStatus(401);
    }
}
