<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\Academic\SchoolClass;
use App\Models\Child\Child;
use App\Models\School\TeacherProfile;
use App\Models\School\TeacherRoleType;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Sınıf yönetimi: Öğretmen atama/çıkarma ve ihtiyaç listesi (materials) CRUD.
 */
class ClassManagementController extends BaseController
{
    // ──────────────────────────────────────────────────────────────
    // ÖĞRETMEN ATAMA
    // ──────────────────────────────────────────────────────────────

    /**
     * Sınıfa atanmış öğretmenleri listele
     */
    public function classTeachers(): JsonResponse
    {
        try {
            $class = $this->resolveClass();
            if (! $class) {
                return $this->errorResponse('Sınıf bulunamadı.', 404);
            }

            $teacherList = $class->teachers()->with('user')->get();
            $roleTypeIds = $teacherList->pluck('pivot.teacher_role_type_id')->filter()->unique();
            $roleTypeMap = $roleTypeIds->isNotEmpty()
                ? TeacherRoleType::whereIn('id', $roleTypeIds)->get()->keyBy('id')
                : collect();

            $teachers = $teacherList->map(fn ($t) => [
                'id' => $t->id,
                'user_id' => $t->user_id,
                'name' => trim(($t->user?->name ?? '').' '.($t->user?->surname ?? '')),
                'title' => $t->title,
                'teacher_role_type_id' => $t->pivot->teacher_role_type_id,
                'role_type' => $t->pivot->teacher_role_type_id && $roleTypeMap->has($t->pivot->teacher_role_type_id)
                    ? ['id' => $roleTypeMap->get($t->pivot->teacher_role_type_id)->id, 'name' => $roleTypeMap->get($t->pivot->teacher_role_type_id)->name]
                    : null,
            ]);

            return $this->successResponse($teachers);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Sınıf bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::classTeachers Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmenler yüklenemedi.', 500);
        }
    }

    /**
     * Sınıfa öğretmen ata
     */
    public function assignTeacher(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_profile_id' => ['required', 'exists:teacher_profiles,id'],
            'teacher_role_type_id' => ['required', 'exists:teacher_role_types,id'],
        ]);

        $schoolId = $this->resolveSchoolId();
        if (! $schoolId) {
            return $this->errorResponse('Okul bulunamadı.', 404);
        }

        try {
            DB::beginTransaction();

            $class = $this->resolveClass($schoolId);
            if (! $class) {
                return $this->errorResponse('Sınıf bulunamadı.', 404);
            }

            $teacher = TeacherProfile::withoutGlobalScope('tenant')
                ->where('id', $request->teacher_profile_id)
                ->where(function ($q) use ($schoolId) {
                    $q->where('school_id', $schoolId)
                        ->orWhereHas('schools', fn ($s) => $s->where('schools.id', $schoolId));
                })
                ->firstOrFail();

            $alreadyAssigned = DB::table('class_teacher_assignments')
                ->where('class_id', $class->id)
                ->where('teacher_profile_id', $teacher->id)
                ->exists();

            if ($alreadyAssigned) {
                DB::rollBack();

                return $this->errorResponse('Bu öğretmen zaten bu sınıfa atanmış.', 422);
            }

            $class->teachers()->syncWithoutDetaching([
                $teacher->id => ['teacher_role_type_id' => $request->teacher_role_type_id ?? null],
            ]);

            DB::commit();

            return $this->successResponse(null, 'Öğretmen sınıfa atandı.', 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();

            return $this->errorResponse('Sınıf veya öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassManagementController::assignTeacher Error: '.$e->getMessage());

            return $this->errorResponse('Atama başarısız.', 500);
        }
    }

    /**
     * Sınıftan öğretmeni çıkar
     */
    public function removeTeacher(int $teacherProfileId): JsonResponse
    {
        try {
            DB::beginTransaction();

            $class = $this->resolveClass();
            if (! $class) {
                return $this->errorResponse('Sınıf bulunamadı.', 404);
            }

            $class->teachers()->detach($teacherProfileId);

            DB::commit();

            return $this->successResponse(null, 'Öğretmen sınıftan çıkarıldı.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassManagementController::removeTeacher Error: '.$e->getMessage());

            return $this->errorResponse('İşlem başarısız.', 500);
        }
    }

    /**
     * Okulun öğretmen listesi.
     * ?detailed=1 → Görev türü, istihdam tipi, aktiflik bilgisi de döner (okul detayı sekmesi için).
     * Hem eski school_id hem yeni school_teacher_assignments pivot desteklenir.
     */
    public function schoolTeachers(Request $request): JsonResponse
    {
        try {
            $schoolId = $this->resolveSchoolId();
            if (! $schoolId) {
                return $this->errorResponse('Okul bulunamadı.', 404);
            }

            $detailed = (bool) $request->query('detailed', false);

            $teachers = TeacherProfile::withoutGlobalScope('tenant')->with('user')
                ->where(function ($q) use ($schoolId) {
                    $q->where('school_id', $schoolId)
                        ->orWhereHas('schools', fn ($s) => $s->where('schools.id', $schoolId)->where('school_teacher_assignments.is_active', true));
                })
                ->get();

            $teacherIds = $teachers->pluck('id');

            // Pivot verisi (employment type, role type, is_active)
            $pivotMap = DB::table('school_teacher_assignments')
                ->where('school_id', $schoolId)
                ->whereIn('teacher_profile_id', $teacherIds)
                ->get()
                ->keyBy('teacher_profile_id');

            $roleTypeIds = $pivotMap->pluck('teacher_role_type_id')->filter()->unique();
            $roleTypeMap = $roleTypeIds->isNotEmpty()
                ? TeacherRoleType::whereIn('id', $roleTypeIds)->get()->keyBy('id')
                : collect();

            // Bu okuldaki sınıf atamaları
            $classMap = DB::table('class_teacher_assignments')
                ->join('classes', 'classes.id', '=', 'class_teacher_assignments.class_id')
                ->where('classes.school_id', $schoolId)
                ->whereIn('class_teacher_assignments.teacher_profile_id', $teacherIds)
                ->select('class_teacher_assignments.teacher_profile_id', 'classes.id as class_id', 'classes.name as class_name')
                ->get()
                ->groupBy('teacher_profile_id');

            $result = $teachers->map(function ($t) use ($pivotMap, $roleTypeMap, $classMap) {
                $pivot = $pivotMap->get($t->id);
                $roleType = $pivot?->teacher_role_type_id
                    ? $roleTypeMap->get($pivot->teacher_role_type_id)
                    : null;

                $base = [
                    'id' => $t->id,
                    'user_id' => $t->user_id,
                    'name' => trim(($t->user?->name ?? '').' '.($t->user?->surname ?? '')),
                    'title' => $t->title,
                    'employment_type' => $pivot?->employment_type ?? $t->employment_type,
                    'is_active' => (bool) ($pivot ? $pivot->is_active : true),
                    'role_type' => $roleType ? ['id' => $roleType->id, 'name' => $roleType->name] : null,
                    'classes' => ($classMap->get($t->id) ?? collect())->map(fn ($c) => [
                        'id' => $c->class_id,
                        'name' => $c->class_name,
                    ])->values(),
                ];

                return $base;
            });

            return $this->successResponse($result);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::schoolTeachers Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmenler yüklenemedi.', 500);
        }
    }

    /**
     * Okula öğretmen ata — devre dışı.
     * Öğretmenler okula sadece davet/kabul akışı üzerinden katılabilir.
     */
    public function assignTeacherToSchool(Request $request, int $schoolId): JsonResponse
    {
        return $this->errorResponse('Öğretmenler okula doğrudan atanamaz. Davet gönderin veya katılma talebini onaylayın.', 405);
    }

    /** @deprecated */
    private function _assignTeacherToSchool_disabled(Request $request, int $schoolId): JsonResponse
    {
        $data = $request->validate([
            'teacher_profile_id' => ['required', 'exists:teacher_profiles,id'],
            'teacher_role_type_id' => ['nullable', 'exists:teacher_role_types,id'],
            'employment_type' => ['nullable', 'in:full_time,part_time,contract,intern,volunteer'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        try {
            $teacher = TeacherProfile::where('id', $data['teacher_profile_id'])
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $teacher->schools()->syncWithoutDetaching([
                $schoolId => [
                    'employment_type' => $data['employment_type'] ?? 'full_time',
                    'teacher_role_type_id' => $data['teacher_role_type_id'] ?? null,
                    'start_date' => $data['start_date'] ?? null,
                    'end_date' => $data['end_date'] ?? null,
                    'is_active' => true,
                ],
            ]);

            return $this->successResponse(null, 'Öğretmen okula atandı.', 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::assignTeacherToSchool Error: '.$e->getMessage());

            return $this->errorResponse('Atama başarısız.', 500);
        }
    }

    /**
     * Okul-öğretmen atamasını kaldır — devre dışı.
     */
    public function removeTeacherFromSchool(int $schoolId, int $teacherProfileId): JsonResponse
    {
        return $this->errorResponse('Bu işlem için üyelik kaldırma endpoint\'ini kullanın.', 405);
    }

    /** @deprecated */
    private function _removeTeacherFromSchool_disabled(int $schoolId, int $teacherProfileId): JsonResponse
    {
        try {
            $teacher = TeacherProfile::where('id', $teacherProfileId)
                ->where('tenant_id', $this->user()->tenant_id)
                ->firstOrFail();

            $teacher->schools()->detach($schoolId);

            return $this->successResponse(null, 'Öğretmen okuldan çıkarıldı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Öğretmen bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::removeTeacherFromSchool Error: '.$e->getMessage());

            return $this->errorResponse('İşlem başarısız.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // ÖĞRENCİ ATAMA
    // ──────────────────────────────────────────────────────────────

    /**
     * Sınıfa öğrenci ata (yaş aralığı kontrolü ile)
     */
    public function assignChild(Request $request): JsonResponse
    {
        $request->validate([
            'child_id' => ['required', 'integer', 'exists:children,id'],
        ]);

        $schoolId = $this->resolveSchoolId();
        if (! $schoolId) {
            return $this->errorResponse('Okul bulunamadı.', 404);
        }

        try {
            $class = $this->resolveClass($schoolId);
            if (! $class) {
                return $this->errorResponse('Sınıf bulunamadı.', 404);
            }

            if (! $class->is_active) {
                return $this->errorResponse('Pasif sınıfa öğrenci ataması yapılamaz.', 422);
            }

            $child = Child::withoutGlobalScope('tenant')
                ->where('id', $request->child_id)
                ->where('school_id', $schoolId)
                ->first();

            if (! $child) {
                return $this->errorResponse('Öğrenci bu okula kayıtlı değil.', 422);
            }

            // Yaş aralığı kontrolü
            if ($child->birth_date) {
                $age = Carbon::parse($child->birth_date)->age;

                if ($class->age_min !== null && $age < $class->age_min) {
                    return $this->errorResponse(
                        "{$child->full_name} adlı öğrencinin yaşı ({$age}) sınıfın minimum yaş sınırının ({$class->age_min}) altında.",
                        422
                    );
                }

                if ($class->age_max !== null && $age > $class->age_max) {
                    return $this->errorResponse(
                        "{$child->full_name} adlı öğrencinin yaşı ({$age}) sınıfın maksimum yaş sınırını ({$class->age_max}) aşıyor.",
                        422
                    );
                }
            }

            // Herhangi bir sınıfa kayıtlı mı? (bir öğrenci tek sınıfa kayıt olabilir)
            $existingClass = $child->classes()->first();
            if ($existingClass) {
                if ($existingClass->id === $class->id) {
                    return $this->errorResponse('Öğrenci zaten bu sınıfa kayıtlı.', 422);
                }

                return $this->errorResponse(
                    "{$child->full_name} adlı öğrenci zaten \"{$existingClass->name}\" sınıfına kayıtlı. Önce mevcut sınıftan çıkarın.",
                    422
                );
            }

            $class->children()->attach($child->id);

            return $this->successResponse(null, 'Öğrenci sınıfa atandı.', 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Sınıf bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::assignChild Error: '.$e->getMessage());

            return $this->errorResponse('Atama başarısız.', 500);
        }
    }

    /**
     * Öğrenciyi sınıftan çıkar
     */
    public function removeChild(int $childId): JsonResponse
    {
        try {
            $class = $this->resolveClass();
            if (! $class) {
                return $this->errorResponse('Sınıf bulunamadı.', 404);
            }

            $class->children()->detach($childId);

            return $this->successResponse(null, 'Öğrenci sınıftan çıkarıldı.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Sınıf bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::removeChild Error: '.$e->getMessage());

            return $this->errorResponse('İşlem başarısız.', 500);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // İHTİYAÇ LİSTESİ (Supply List / Materials)
    // ──────────────────────────────────────────────────────────────

    /**
     * Sınıfın ihtiyaç listesini getir
     */
    public function supplyList(int $schoolId, int $classId): JsonResponse
    {
        try {
            $materials = \App\Models\Activity\Material::where('school_id', $schoolId)
                ->where('class_id', $classId)
                ->orderBy('due_date')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'description' => $m->description,
                    'quantity' => $m->quantity,
                    'due_date' => $m->due_date,
                    'class_id' => $m->class_id,
                    'school_id' => $m->school_id,
                ]);

            return $this->successResponse($materials);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::supplyList Error: '.$e->getMessage());

            return $this->errorResponse('İhtiyaç listesi yüklenemedi.', 500);
        }
    }

    /**
     * İhtiyaç listesine yeni kalem ekle
     */
    public function addSupplyItem(Request $request, int $schoolId, int $classId): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'due_date' => ['nullable', 'date'],
        ]);

        try {
            DB::beginTransaction();

            $academic = \App\Models\Academic\AcademicYear::where('school_id', $schoolId)
                ->where('is_active', true)
                ->latest()
                ->first();

            $material = \App\Models\Activity\Material::create([
                'school_id' => $schoolId,
                'class_id' => $classId,
                'academic_year_id' => $academic?->id,
                'name' => $request->name,
                'description' => $request->description,
                'quantity' => $request->quantity ?? 1,
                'due_date' => $request->due_date,
                'created_by' => $this->user()->id,
            ]);

            DB::commit();

            return $this->successResponse([
                'id' => $material->id,
                'name' => $material->name,
                'description' => $material->description,
                'quantity' => $material->quantity,
                'due_date' => $material->due_date,
            ], 'İhtiyaç kalemi eklendi.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassManagementController::addSupplyItem Error: '.$e->getMessage());

            return $this->errorResponse('Ekleme başarısız.', 500);
        }
    }

    /**
     * İhtiyaç kalemi güncelle
     */
    public function updateSupplyItem(Request $request, int $schoolId, int $classId, int $materialId): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'due_date' => ['nullable', 'date'],
        ]);

        try {
            $material = \App\Models\Activity\Material::where('id', $materialId)
                ->where('school_id', $schoolId)
                ->where('class_id', $classId)
                ->firstOrFail();

            $material->update([
                'name' => $request->name,
                'description' => $request->description,
                'quantity' => $request->quantity ?? $material->quantity,
                'due_date' => $request->due_date,
                'updated_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'id' => $material->id,
                'name' => $material->name,
                'description' => $material->description,
                'quantity' => $material->quantity,
                'due_date' => $material->due_date,
            ], 'İhtiyaç kalemi güncellendi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Materyal bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::updateSupplyItem Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * İhtiyaç kalemi sil
     */
    public function deleteSupplyItem(int $schoolId, int $classId, int $materialId): JsonResponse
    {
        try {
            $material = \App\Models\Activity\Material::where('id', $materialId)
                ->where('school_id', $schoolId)
                ->where('class_id', $classId)
                ->firstOrFail();

            $material->delete();

            return $this->successResponse(null, 'İhtiyaç kalemi silindi.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->errorResponse('Materyal bulunamadı.', 404);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::deleteSupplyItem Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }

    /**
     * Route parametresinden okul ID'sini çöz (integer veya ULID destekler).
     * Tenant sahipliği doğrulanır.
     */
    private function resolveSchoolId(): ?int
    {
        $param = request()->route('school_id');
        if (! $param) {
            return null;
        }

        $query = \App\Models\School\School::where('tenant_id', $this->user()->tenant_id);

        $school = is_numeric($param)
            ? $query->where('id', (int) $param)->first()
            : $query->where('ulid', $param)->first();

        return $school?->id;
    }

    /**
     * Route parametresinden sınıf modelini çöz (integer veya ULID destekler).
     * Okul ID belirtilmezse resolveSchoolId() ile otomatik çözülür.
     */
    private function resolveClass(?int $schoolId = null): ?SchoolClass
    {
        $schoolId ??= $this->resolveSchoolId();
        if (! $schoolId) {
            return null;
        }

        $param = request()->route('class_id');
        if (! $param) {
            return null;
        }

        $query = SchoolClass::where('school_id', $schoolId);

        return is_numeric($param)
            ? $query->where('id', (int) $param)->first()
            : $query->where('ulid', $param)->first();
    }
}
