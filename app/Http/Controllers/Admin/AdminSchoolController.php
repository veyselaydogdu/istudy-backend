<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Http\Resources\SchoolResource;
use App\Models\Academic\SchoolClass;
use App\Models\School\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Okul Yönetimi Controller
 *
 * Süper Admin tüm okulları listeleyebilir, detaylarını görebilir,
 * okul açıp kapatabilir, istatistikleri izleyebilir.
 */
class AdminSchoolController extends BaseController
{
    /**
     * Tüm okulları listele (arama ve filtreleme)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = School::query();

            // Arama
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('registration_code', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Tenant filtresi
            if ($tenantId = $request->input('tenant_id')) {
                $query->where('tenant_id', $tenantId);
            }

            // Durum filtresi
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $perPage = $request->input('per_page', 15);
            $schools = $query->withCount(['children', 'classes', 'teachers', 'academicYears'])
                ->with(['tenant'])
                ->latest()
                ->paginate($perPage);

            return $this->paginatedResponse(
                SchoolResource::collection($schools)
            );
        } catch (\Throwable $e) {
            Log::error('Admin okul listeleme hatası: '.$e->getMessage());

            return $this->errorResponse('Okullar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okul detayı (tüm ilişkiler ve istatistikler)
     */
    public function show(School $school): JsonResponse
    {
        try {
            $school->load([
                'tenant',
                'academicYears' => fn ($q) => $q->withCount('classes')->latest('start_date'),
                'classes' => fn ($q) => $q->withCount('children'),
                'teachers',
            ]);

            $stats = [
                'total_children' => $school->children()->count(),
                'active_children' => $school->children()->where('status', 'active')->count(),
                'total_classes' => $school->classes()->count(),
                'total_teachers' => $school->teachers()->count(),
                'total_academic_years' => $school->academicYears()->count(),
                'current_academic_year' => $school->academicYears()->where('is_current', true)->first()?->name,
                'total_announcements' => $school->announcements()->count(),
                'total_homework' => $school->homework()->count(),
                'pending_enrollment_requests' => $school->enrollmentRequests()->where('status', 'pending')->count(),
            ];

            return $this->successResponse([
                'school' => new SchoolResource($school),
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            Log::error('Admin okul detay hatası: '.$e->getMessage());

            return $this->errorResponse('Okul detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okul güncelle
     */
    public function update(Request $request, School $school): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'address' => 'nullable|string|max:500',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email',
                'website' => 'nullable|url',
                'is_active' => 'nullable|boolean',
            ]);

            $data = $request->only(['name', 'description', 'address', 'phone', 'email', 'website', 'is_active']);
            $data['updated_by'] = $this->user()->id;

            $school->update($data);

            DB::commit();

            return $this->successResponse(
                new SchoolResource($school->fresh()),
                'Okul başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin okul güncelleme hatası: '.$e->getMessage());

            return $this->errorResponse('Okul güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okulu aktif/pasif yap
     */
    public function toggleStatus(School $school): JsonResponse
    {
        DB::beginTransaction();
        try {
            $school->update([
                'is_active' => ! $school->is_active,
                'updated_by' => $this->user()->id,
            ]);

            DB::commit();

            $status = $school->is_active ? 'aktif' : 'pasif';

            return $this->successResponse(
                new SchoolResource($school->fresh()),
                "Okul {$status} duruma alındı."
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin okul durum değiştirme hatası: '.$e->getMessage());

            return $this->errorResponse('Okul durumu değiştirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okulun sınıflarını listele (tüm eğitim yılları)
     */
    public function classes(School $school, Request $request): JsonResponse
    {
        try {
            $query = SchoolClass::where('school_id', $school->id)
                ->withCount('children')
                ->with('academicYear');

            if ($yearId = $request->input('academic_year_id')) {
                $query->where('academic_year_id', $yearId);
            }

            return $this->successResponse(
                $query->get(),
                'Sınıflar listelendi.'
            );
        } catch (\Throwable $e) {
            Log::error('Admin okul sınıflar hatası: '.$e->getMessage());

            return $this->errorResponse('Sınıflar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okulun çocuklarını listele
     */
    public function children(School $school, Request $request): JsonResponse
    {
        try {
            $query = $school->children()->with(['familyProfile.owner']);

            if ($status = $request->input('status')) {
                $query->where('status', $status);
            }

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            }

            $perPage = $request->input('per_page', 15);

            return $this->paginatedResponse(
                $query->latest()->paginate($perPage)
            );
        } catch (\Throwable $e) {
            Log::error('Admin okul çocuklar hatası: '.$e->getMessage());

            return $this->errorResponse('Çocuklar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Okul sil (soft delete)
     */
    public function destroy(School $school): JsonResponse
    {
        DB::beginTransaction();
        try {
            // Aktif öğrencisi varsa uyar
            $activeChildren = $school->children()->where('status', 'active')->count();
            if ($activeChildren > 0) {
                return $this->errorResponse(
                    "Bu okulun {$activeChildren} aktif öğrencisi var. Önce öğrencileri taşıyın veya durumlarını değiştirin.",
                    422
                );
            }

            $school->update(['is_active' => false, 'updated_by' => $this->user()->id]);
            $school->delete();

            DB::commit();

            return $this->successResponse(null, 'Okul başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Admin okul silme hatası: '.$e->getMessage());

            return $this->errorResponse('Okul silinirken bir hata oluştu.', 500);
        }
    }
}
