<?php

namespace App\Http\Controllers\Parents;

use App\Http\Requests\Parent\StoreParentChildRequest;
use App\Http\Requests\Parent\UpdateParentChildRequest;
use App\Http\Resources\Parent\ParentChildResource;
use App\Models\Child\Child;
use App\Models\Health\Allergen;
use App\Models\Health\MedicalCondition;
use App\Models\Health\Medication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ParentChildController extends BaseParentController
{
    public function index(): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->successResponse([], 'Çocuklar listelendi.');
            }

            $children = $familyProfile->children()
                ->withoutGlobalScope('tenant')
                ->with(['allergens', 'conditions', 'medications', 'nationality'])
                ->get();

            return $this->successResponse(
                ParentChildResource::collection($children),
                'Çocuklar listelendi.'
            );
        } catch (\Throwable $e) {
            Log::error('ParentChildController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(StoreParentChildRequest $request): JsonResponse
    {
        try {
            $familyProfile = $this->getFamilyProfile();

            if (! $familyProfile) {
                return $this->errorResponse('Aile profili bulunamadı.', 404);
            }

            $data = $request->validated();

            $child = Child::withoutGlobalScope('tenant')->create([
                'family_profile_id' => $familyProfile->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'birth_date' => $data['birth_date'],
                'gender' => $data['gender'] ?? null,
                'blood_type' => $data['blood_type'] ?? null,
                'identity_number' => $data['identity_number'] ?? null,
                'passport_number' => $data['passport_number'] ?? null,
                'nationality_country_id' => $data['nationality_country_id'] ?? null,
                'languages' => $data['languages'] ?? null,
                'parent_notes' => $data['parent_notes'] ?? null,
                'special_notes' => $data['special_notes'] ?? null,
                'status' => 'active',
                'created_by' => $this->user()->id,
            ]);

            if (! empty($data['allergen_ids'])) {
                $child->allergens()->sync($data['allergen_ids']);
            }

            if (! empty($data['condition_ids'])) {
                $child->conditions()->sync($data['condition_ids']);
            }

            if (! empty($data['medications'])) {
                $this->saveMedications($child, $data['medications']);
            }

            $child->load(['allergens', 'conditions', 'medications', 'nationality']);

            return $this->successResponse(
                ParentChildResource::make($child),
                'Çocuk başarıyla eklendi.',
                201
            );
        } catch (\Throwable $e) {
            Log::error('ParentChildController::store Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $child): JsonResponse
    {
        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $childModel->load(['allergens', 'conditions', 'medications', 'nationality']);

            return $this->successResponse(
                ParentChildResource::make($childModel),
                'Çocuk bilgileri.'
            );
        } catch (\Throwable $e) {
            Log::error('ParentChildController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function update(UpdateParentChildRequest $request, int $child): JsonResponse
    {
        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $data = $request->validated();
            $data['updated_by'] = $this->user()->id;

            $childModel->update($data);
            $childModel->load(['allergens', 'conditions', 'medications', 'nationality']);

            return $this->successResponse(
                ParentChildResource::make($childModel),
                'Çocuk bilgileri güncellendi.'
            );
        } catch (\Throwable $e) {
            Log::error('ParentChildController::update Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $child): JsonResponse
    {
        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $childModel->delete();

            return $this->successResponse(null, 'Çocuk kaydı silindi.');
        } catch (\Throwable $e) {
            Log::error('ParentChildController::destroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function syncAllergens(Request $request, int $child): JsonResponse
    {
        $data = $request->validate([
            'allergen_ids' => ['present', 'array'],
            'allergen_ids.*' => ['integer', 'exists:allergens,id'],
        ]);

        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $childModel->allergens()->sync($data['allergen_ids']);

            return $this->successResponse(null, 'Alerjenler güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ParentChildController::syncAllergens Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Çocuğun ilaçlarını günceller.
     * Hem kayıtlı (medication_id) hem custom (sadece custom_name) ilaçları destekler.
     */
    public function syncMedications(Request $request, int $child): JsonResponse
    {
        $data = $request->validate([
            'medications' => ['present', 'array'],
            'medications.*.medication_id' => ['nullable', 'integer', 'exists:medications,id'],
            'medications.*.custom_name' => ['nullable', 'string', 'max:150'],
            'medications.*.dose' => ['nullable', 'string', 'max:100'],
            'medications.*.usage_time' => ['nullable', 'array'],
            'medications.*.usage_days' => ['nullable', 'array'],
        ]);

        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $this->saveMedications($childModel, $data['medications']);

            return $this->successResponse(null, 'İlaçlar güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ParentChildController::syncMedications Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function syncConditions(Request $request, int $child): JsonResponse
    {
        $data = $request->validate([
            'condition_ids' => ['present', 'array'],
            'condition_ids.*' => ['integer', 'exists:medical_conditions,id'],
        ]);

        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $childModel->conditions()->sync($data['condition_ids']);

            return $this->successResponse(null, 'Tıbbi durumlar güncellendi.');
        } catch (\Throwable $e) {
            Log::error('ParentChildController::syncConditions Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Veli özel alerjen önerisi ekle.
     * Pending olarak oluşturulur, çocuğa hemen bağlanır.
     */
    public function suggestAllergen(Request $request, int $child): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $familyProfile = $this->getFamilyProfile();

            $allergen = Allergen::withoutGlobalScopes()->create([
                'name' => trim($request->name),
                'description' => $request->description,
                'risk_level' => 'medium',
                'tenant_id' => $familyProfile?->tenant_id,
                'status' => 'pending',
                'suggested_by_user_id' => $this->user()->id,
                'created_by' => $this->user()->id,
            ]);

            $childModel->allergens()->attach($allergen->id);

            return $this->successResponse([
                'id' => $allergen->id,
                'name' => $allergen->name,
                'status' => 'pending',
            ], 'Alerjen önerisi gönderildi. Onay bekleniyor.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentChildController::suggestAllergen Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Veli özel hastalık önerisi ekle.
     */
    public function suggestCondition(Request $request, int $child): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $familyProfile = $this->getFamilyProfile();

            $condition = MedicalCondition::withoutGlobalScopes()->create([
                'name' => trim($request->name),
                'description' => $request->description,
                'tenant_id' => $familyProfile?->tenant_id,
                'status' => 'pending',
                'suggested_by_user_id' => $this->user()->id,
                'created_by' => $this->user()->id,
            ]);

            $childModel->conditions()->attach($condition->id);

            return $this->successResponse([
                'id' => $condition->id,
                'name' => $condition->name,
                'status' => 'pending',
            ], 'Hastalık önerisi gönderildi. Onay bekleniyor.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentChildController::suggestCondition Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Veli özel ilaç önerisi ekle.
     */
    public function suggestMedication(Request $request, int $child): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'dose' => ['nullable', 'string', 'max:100'],
            'usage_time' => ['nullable', 'array'],
            'usage_days' => ['nullable', 'array'],
        ]);

        try {
            $childModel = $this->findOwnedChild($child);

            if (! $childModel) {
                return $this->errorResponse('Çocuk bulunamadı.', 404);
            }

            $familyProfile = $this->getFamilyProfile();

            $medication = Medication::withoutGlobalScopes()->create([
                'name' => trim($request->name),
                'tenant_id' => $familyProfile?->tenant_id,
                'status' => 'pending',
                'suggested_by_user_id' => $this->user()->id,
                'created_by' => $this->user()->id,
            ]);

            // Pivot'a dose/usage bilgilerini ekle
            DB::table('child_medications')->insert([
                'child_id' => $childModel->id,
                'medication_id' => $medication->id,
                'custom_name' => null,
                'dose' => $request->dose,
                'usage_time' => isset($request->usage_time) ? json_encode($request->usage_time) : null,
                'usage_days' => isset($request->usage_days) ? json_encode($request->usage_days) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $this->successResponse([
                'id' => $medication->id,
                'name' => $medication->name,
                'status' => 'pending',
            ], 'İlaç önerisi gönderildi. Onay bekleniyor.', 201);
        } catch (\Throwable $e) {
            Log::error('ParentChildController::suggestMedication Error', ['message' => $e->getMessage()]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Hem kayıtlı hem custom ilaçları kaydeder.
     * BelongsToMany null key alamayacağı için custom ilaçlar direkt DB insert ile yazılır.
     *
     * @param  array<int, array<string, mixed>>  $medications
     */
    private function saveMedications(Child $child, array $medications): void
    {
        // Önce tüm kayıtlı ilaçları temizle
        $child->medications()->detach();

        // Custom ilaçları (medication_id = null) da temizle
        DB::table('child_medications')
            ->where('child_id', $child->id)
            ->whereNull('medication_id')
            ->delete();

        foreach ($medications as $med) {
            $pivot = [
                'custom_name' => $med['custom_name'] ?? null,
                'dose' => $med['dose'] ?? null,
                'usage_time' => isset($med['usage_time']) ? json_encode($med['usage_time']) : null,
                'usage_days' => isset($med['usage_days']) ? json_encode($med['usage_days']) : null,
            ];

            if (! empty($med['medication_id'])) {
                $child->medications()->attach($med['medication_id'], $pivot);
            } elseif (! empty($med['custom_name'])) {
                DB::table('child_medications')->insert([
                    'child_id' => $child->id,
                    'medication_id' => null,
                    ...$pivot,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
