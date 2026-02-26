<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\Academic\SchoolClass;
use App\Models\School\TeacherProfile;
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
    public function classTeachers(int $schoolId, int $classId): JsonResponse
    {
        try {
            $class = SchoolClass::where('id', $classId)
                ->where('school_id', $schoolId)
                ->firstOrFail();

            $teachers = $class->teachers()->with('user')->get()->map(fn ($t) => [
                'id' => $t->id,
                'user_id' => $t->user_id,
                'name' => $t->user?->name.' '.($t->user?->surname ?? ''),
                'title' => $t->title,
                'role' => $t->pivot->role ?? 'assistant_teacher',
                'school_id' => $t->school_id,
            ]);

            return $this->successResponse($teachers);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::classTeachers Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmenler yüklenemedi.', 500);
        }
    }

    /**
     * Sınıfa öğretmen ata
     */
    public function assignTeacher(Request $request, int $schoolId, int $classId): JsonResponse
    {
        $request->validate([
            'teacher_profile_id' => ['required', 'exists:teacher_profiles,id'],
            'role' => ['nullable', 'string', 'in:head_teacher,assistant_teacher,substitute_teacher'],
        ]);

        try {
            DB::beginTransaction();

            $class = SchoolClass::where('id', $classId)
                ->where('school_id', $schoolId)
                ->firstOrFail();

            $teacher = TeacherProfile::where('id', $request->teacher_profile_id)
                ->where('school_id', $schoolId)
                ->firstOrFail();

            $class->teachers()->syncWithoutDetaching([
                $teacher->id => ['role' => $request->role ?? 'assistant_teacher'],
            ]);

            DB::commit();

            return $this->successResponse(null, 'Öğretmen sınıfa atandı.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('ClassManagementController::assignTeacher Error: '.$e->getMessage());

            return $this->errorResponse('Atama başarısız: '.$e->getMessage(), 500);
        }
    }

    /**
     * Sınıftan öğretmeni çıkar
     */
    public function removeTeacher(int $schoolId, int $classId, int $teacherProfileId): JsonResponse
    {
        try {
            DB::beginTransaction();

            $class = SchoolClass::where('id', $classId)
                ->where('school_id', $schoolId)
                ->firstOrFail();

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
     * Okulun öğretmen listesi (atanabilir öğretmenler için)
     */
    public function schoolTeachers(int $schoolId): JsonResponse
    {
        try {
            $teachers = TeacherProfile::with('user')
                ->where('school_id', $schoolId)
                ->get()
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'user_id' => $t->user_id,
                    'name' => trim(($t->user?->name ?? '').' '.($t->user?->surname ?? '')),
                    'title' => $t->title,
                ]);

            return $this->successResponse($teachers);
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::schoolTeachers Error: '.$e->getMessage());

            return $this->errorResponse('Öğretmenler yüklenemedi.', 500);
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
        } catch (\Throwable $e) {
            Log::error('ClassManagementController::deleteSupplyItem Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }
}
