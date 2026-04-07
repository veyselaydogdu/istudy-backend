<?php

namespace Tests\Feature\Parents;

use App\Models\Child\Child;
use App\Models\Child\FamilyMember;
use App\Models\Child\FamilyProfile;
use App\Models\Health\Allergen;
use App\Models\Health\MedicalCondition;
use App\Models\Health\Medication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ParentChildStoreTest extends TestCase
{
    use RefreshDatabase;

    private User $parentUser;

    private FamilyProfile $familyProfile;

    protected function setUp(): void
    {
        parent::setUp();

        // Veli kullanıcı oluştur
        $this->parentUser = User::factory()->create([
            'tenant_id' => null,
        ]);

        // FamilyProfile oluştur
        $this->familyProfile = FamilyProfile::withoutGlobalScope('tenant')->create([
            'owner_user_id' => $this->parentUser->id,
            'tenant_id' => null,
            'created_by' => $this->parentUser->id,
        ]);

        // FamilyMember (super_parent) oluştur
        FamilyMember::withoutGlobalScope('tenant')->create([
            'family_profile_id' => $this->familyProfile->id,
            'user_id' => $this->parentUser->id,
            'relation_type' => 'parent',
            'role' => 'super_parent',
            'is_active' => true,
            'accepted_at' => now(),
            'created_by' => $this->parentUser->id,
        ]);

        Sanctum::actingAs($this->parentUser, ['role:parent']);
    }

    /** @test */
    public function can_store_child_with_minimum_required_fields(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'birth_date' => '2018-05-15',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.first_name', 'Ali')
            ->assertJsonPath('data.last_name', 'Yılmaz')
            ->assertJsonPath('data.birth_date', '2018-05-15');

        $this->assertDatabaseHas('children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'family_profile_id' => $this->familyProfile->id,
        ]);
    }

    /** @test */
    public function can_store_child_with_all_fields(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ayşe',
            'last_name' => 'Demir',
            'birth_date' => '2019-03-20',
            'gender' => 'female',
            'blood_type' => 'A+',
            'identity_number' => '12345678901',
            'passport_number' => 'A12345678',
            'parent_notes' => 'Test notu',
            'languages' => ['Türkçe', 'İngilizce'],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.gender', 'female')
            ->assertJsonPath('data.blood_type', 'A+')
            ->assertJsonPath('data.identity_number', '12345678901')
            ->assertJsonPath('data.passport_number', 'A12345678');

        $this->assertDatabaseHas('children', [
            'passport_number' => 'A12345678',
            'blood_type' => 'A+',
        ]);
    }

    /** @test */
    public function requires_first_name(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'last_name' => 'Yılmaz',
            'birth_date' => '2018-05-15',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function requires_last_name(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'birth_date' => '2018-05-15',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function requires_birth_date(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function birth_date_must_be_valid_date(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'birth_date' => 'gecersiz-tarih',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function can_store_child_with_allergens(): void
    {
        $allergen = Allergen::withoutGlobalScopes()->create([
            'name' => 'Fıstık',
            'risk_level' => 'high',
            'status' => 'approved',
            'created_by' => $this->parentUser->id,
        ]);

        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'birth_date' => '2018-05-15',
            'allergen_ids' => [$allergen->id],
        ]);

        $response->assertStatus(201);

        $child = Child::withoutGlobalScopes()->where('first_name', 'Ali')->first();
        $this->assertNotNull($child);
        $this->assertDatabaseHas('child_allergens', [
            'child_id' => $child->id,
            'allergen_id' => $allergen->id,
        ]);
    }

    /** @test */
    public function can_store_child_with_medical_conditions(): void
    {
        $condition = MedicalCondition::withoutGlobalScopes()->create([
            'name' => 'Astım',
            'status' => 'approved',
            'created_by' => $this->parentUser->id,
        ]);

        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'birth_date' => '2018-05-15',
            'condition_ids' => [$condition->id],
        ]);

        $response->assertStatus(201);

        $child = Child::withoutGlobalScopes()->where('first_name', 'Ali')->first();
        $this->assertDatabaseHas('child_conditions', [
            'child_id' => $child->id,
            'condition_id' => $condition->id,
        ]);
    }

    /** @test */
    public function can_store_child_with_medications(): void
    {
        $medication = Medication::withoutGlobalScopes()->create([
            'name' => 'Ventolin',
            'status' => 'approved',
            'created_by' => $this->parentUser->id,
        ]);

        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'birth_date' => '2018-05-15',
            'medications' => [
                [
                    'medication_id' => $medication->id,
                    'dose' => '2 puff',
                    'usage_time' => ['08:00', '20:00'],
                    'usage_days' => ['monday', 'wednesday', 'friday'],
                ],
            ],
        ]);

        $response->assertStatus(201);

        $child = Child::withoutGlobalScopes()->where('first_name', 'Ali')->first();
        $this->assertDatabaseHas('child_medications', [
            'child_id' => $child->id,
            'medication_id' => $medication->id,
            'dose' => '2 puff',
        ]);
    }

    /** @test */
    public function can_store_child_with_custom_medication(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'birth_date' => '2018-05-15',
            'medications' => [
                [
                    'medication_id' => null,
                    'custom_name' => 'Özel İlaç',
                    'dose' => '5ml',
                    'usage_time' => ['08:00'],
                    'usage_days' => [],
                ],
            ],
        ]);

        $response->assertStatus(201);

        $child = Child::withoutGlobalScopes()->where('first_name', 'Ali')->first();
        $this->assertDatabaseHas('child_medications', [
            'child_id' => $child->id,
            'medication_id' => null,
            'custom_name' => 'Özel İlaç',
        ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_store_child(): void
    {
        // Auth guard'ı sıfırla
        auth()->forgetGuards();

        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Ali',
            'last_name' => 'Yılmaz',
            'birth_date' => '2018-05-15',
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function passport_number_is_stored_correctly(): void
    {
        $response = $this->postJson('/api/parent/children', [
            'first_name' => 'Maria',
            'last_name' => 'Garcia',
            'birth_date' => '2017-07-10',
            'passport_number' => 'ES123456',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.passport_number', 'ES123456');

        $this->assertDatabaseHas('children', ['passport_number' => 'ES123456']);
    }

    /** @test */
    public function suggest_allergen_creates_pending_item_and_links_to_child(): void
    {
        // Önce bir çocuk oluştur
        $child = Child::withoutGlobalScopes()->create([
            'family_profile_id' => $this->familyProfile->id,
            'first_name' => 'Test',
            'last_name' => 'Çocuk',
            'birth_date' => '2018-01-01',
            'status' => 'active',
            'created_by' => $this->parentUser->id,
        ]);

        $response = $this->postJson("/api/parent/children/{$child->ulid}/suggest-allergen", [
            'name' => 'Çilek Alerjisi',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('allergens', [
            'name' => 'Çilek Alerjisi',
            'status' => 'pending',
            'suggested_by_user_id' => $this->parentUser->id,
        ]);

        $allergen = Allergen::withoutGlobalScopes()->where('name', 'Çilek Alerjisi')->first();
        $this->assertDatabaseHas('child_allergens', [
            'child_id' => $child->id,
            'allergen_id' => $allergen->id,
        ]);
    }

    /** @test */
    public function suggest_condition_creates_pending_item(): void
    {
        $child = Child::withoutGlobalScopes()->create([
            'family_profile_id' => $this->familyProfile->id,
            'first_name' => 'Test',
            'last_name' => 'Çocuk',
            'birth_date' => '2018-01-01',
            'status' => 'active',
            'created_by' => $this->parentUser->id,
        ]);

        $response = $this->postJson("/api/parent/children/{$child->ulid}/suggest-condition", [
            'name' => 'Özel Hastalık',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('medical_conditions', [
            'name' => 'Özel Hastalık',
            'status' => 'pending',
        ]);
    }
}
