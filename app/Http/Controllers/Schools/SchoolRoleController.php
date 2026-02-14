<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\SchoolRole\StoreSchoolRoleRequest;
use App\Http\Requests\SchoolRole\UpdateSchoolRoleRequest;
use App\Http\Resources\SchoolRoleResource;
use App\Models\School\SchoolRole;
use App\Services\SchoolRoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Okul Rolü Controller
 *
 * Okul ve sınıf bazlı özel rollerin yönetimi.
 */
class SchoolRoleController extends BaseSchoolController
{
    public function __construct(
        protected SchoolRoleService $service
    ) {
        parent::__construct();
    }

    /**
     * Okula ait rolleri listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['school_id', 'class_id', 'is_active']);
            $roles = $this->service->list($filters, 20);

            return $this->paginatedResponse(
                SchoolRoleResource::collection($roles)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Roller listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Roller listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Rol detayı
     */
    public function show(SchoolRole $schoolRole): JsonResponse
    {
        try {
            return $this->successResponse(
                new SchoolRoleResource($schoolRole->load(['permissions', 'userRoles.user']))
            );
        } catch (\Throwable $e) {
            Log::error('Rol detay hatası: ' . $e->getMessage());

            return $this->errorResponse('Rol detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni rol oluştur
     */
    public function store(StoreSchoolRoleRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['created_by'] = $this->user()->id;

            $permissions = $data['permissions'] ?? [];
            unset($data['permissions']);

            $role = $this->service->createWithPermissions($data, $permissions);

            DB::commit();

            return $this->successResponse(
                new SchoolRoleResource($role),
                'Rol başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rol oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse('Rol oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Rol güncelle
     */
    public function update(UpdateSchoolRoleRequest $request, SchoolRole $schoolRole): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['updated_by'] = $this->user()->id;

            $permissions = $data['permissions'] ?? [];
            unset($data['permissions']);

            $role = $this->service->updateWithPermissions($schoolRole, $data, $permissions);

            DB::commit();

            return $this->successResponse(
                new SchoolRoleResource($role),
                'Rol başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rol güncelleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Rol güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Rol sil
     */
    public function destroy(SchoolRole $schoolRole): JsonResponse
    {
        DB::beginTransaction();
        try {
            $schoolRole->permissions()->delete();
            $schoolRole->userRoles()->delete();
            $schoolRole->delete();

            DB::commit();

            return $this->successResponse(null, 'Rol başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rol silme hatası: ' . $e->getMessage());

            return $this->errorResponse('Rol silinirken bir hata oluştu.', 500);
        }
    }

    /**
     * Kullanıcıya rol ata
     */
    public function assignRole(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'school_role_id' => 'required|exists:school_roles,id',
                'school_id' => 'required|exists:schools,id',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $assignment = $this->service->assignRole(
                $request->user_id,
                $request->school_role_id,
                $request->school_id,
                $request->class_id
            );

            DB::commit();

            return $this->successResponse($assignment, 'Rol başarıyla atandı.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rol atama hatası: ' . $e->getMessage());

            return $this->errorResponse('Rol atanırken bir hata oluştu.', 500);
        }
    }

    /**
     * Kullanıcıdan rol kaldır
     */
    public function removeRole(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'school_role_id' => 'required|exists:school_roles,id',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $this->service->removeRole(
                $request->user_id,
                $request->school_role_id,
                $request->class_id
            );

            DB::commit();

            return $this->successResponse(null, 'Rol başarıyla kaldırıldı.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rol kaldırma hatası: ' . $e->getMessage());

            return $this->errorResponse('Rol kaldırılırken bir hata oluştu.', 500);
        }
    }
}
