<?php

namespace App\Http\Controllers\Teachers;

use App\Models\Academic\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * TeacherClassController — Öğretmenin Sınıfları
 *
 * Öğretmenin atandığı sınıfları ve sınıf detaylarını yönetir.
 */
class TeacherClassController extends BaseTeacherController
{
    /**
     * Öğretmenin atandığı sınıfları listeler
     */
    public function index(): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $classes = SchoolClass::with(['school:id,name', 'academicYear:id,name'])
                ->whereHas('teachers', fn ($q) => $q->where('teacher_profile_id', $profile->id))
                ->withCount('children')
                ->get()
                ->map(fn ($class) => [
                    'id' => $class->id,
                    'name' => $class->name,
                    'school_id' => $class->school_id,
                    'school_name' => $class->school?->name,
                    'academic_year' => $class->academicYear?->name,
                    'student_count' => $class->children_count,
                    'color' => $class->color,
                ]);

            return $this->successResponse($classes, 'Sınıflar listelendi.');
        } catch (\Throwable $e) {
            Log::error('TeacherClassController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Sınıflar alınamadı.', 500);
        }
    }

    /**
     * Sınıf detayını döner (öğretmenin atandığı sınıf olmalı)
     */
    public function show(int $classId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            $class = SchoolClass::with([
                'school:id,name',
                'academicYear:id,name',
                'children' => fn ($q) => $q->active()->select('children.id', 'children.first_name', 'children.last_name', 'children.profile_photo'),
            ])
                ->whereHas('teachers', fn ($q) => $q->where('teacher_profile_id', $profile->id))
                ->findOrFail($classId);

            $result = [
                'id' => $class->id,
                'name' => $class->name,
                'school_id' => $class->school_id,
                'school_name' => $class->school?->name,
                'academic_year' => $class->academicYear?->name,
                'color' => $class->color,
                'capacity' => $class->capacity,
                'children' => $class->children->map(fn ($child) => [
                    'id' => $child->id,
                    'full_name' => $child->full_name,
                    'profile_photo' => $child->profile_photo,
                ]),
            ];

            return $this->successResponse($result, 'Sınıf detayı getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherClassController::show Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Sınıf bulunamadı.', 404);
        }
    }

    /**
     * Sınıftaki öğrenci listesi (sağlık özeti dahil)
     */
    public function children(int $classId): JsonResponse
    {
        try {
            $profile = $this->teacherProfile();

            if ($profile instanceof JsonResponse) {
                return $profile;
            }

            // Öğretmenin bu sınıfa atanmış olup olmadığını kontrol et
            $isAssigned = SchoolClass::whereHas('teachers', fn ($q) => $q->where('teacher_profile_id', $profile->id))
                ->where('id', $classId)
                ->exists();

            if (! $isAssigned) {
                return $this->errorResponse('Bu sınıfa erişim yetkiniz yok.', 403);
            }

            $children = \App\Models\Child\Child::whereHas('classes', fn ($q) => $q->where('classes.id', $classId))
                ->active()
                ->with([
                    'allergens' => fn ($q) => $q->withoutGlobalScope('tenant'),
                    'medications' => fn ($q) => $q->withoutGlobalScope('tenant'),
                ])
                ->get()
                ->map(fn ($child) => [
                    'id' => $child->id,
                    'first_name' => $child->first_name,
                    'last_name' => $child->last_name,
                    'full_name' => $child->full_name,
                    'profile_photo' => $child->profile_photo,
                    'birth_date' => $child->birth_date?->format('Y-m-d'),
                    'blood_type' => $child->blood_type,
                    'allergen_count' => $child->allergens->count(),
                    'medication_count' => $child->medications->count(),
                    'allergens' => $child->allergens->map(fn ($a) => ['id' => $a->id, 'name' => $a->name]),
                    'medications' => $child->medications->map(fn ($m) => ['id' => $m->id, 'name' => $m->name]),
                ]);

            return $this->successResponse($children, 'Öğrenci listesi getirildi.');
        } catch (\Throwable $e) {
            Log::error('TeacherClassController::children Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Öğrenci listesi alınamadı.', 500);
        }
    }
}
