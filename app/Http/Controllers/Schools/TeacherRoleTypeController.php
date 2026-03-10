<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\TeacherRoleType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Tenant düzeyinde öğretmen görev türleri yönetimi.
 * Baş Öğretmen, Yardımcı Öğretmen vb. tenant tarafından tanımlanır.
 */
class TeacherRoleTypeController extends BaseController
{
    /**
     * Tenant'ın görev türlerini listele
     */
    public function index(): JsonResponse
    {
        try {
            $types = TeacherRoleType::where('tenant_id', $this->user()->tenant_id)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            return $this->successResponse($types->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'sort_order' => $t->sort_order,
                'is_active' => $t->is_active,
            ]));
        } catch (\Throwable $e) {
            Log::error('TeacherRoleTypeController::index Error: '.$e->getMessage());

            return $this->errorResponse('Görev türleri yüklenemedi.', 500);
        }
    }

    /**
     * Yeni görev türü oluştur
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        try {
            $type = TeacherRoleType::create([
                'tenant_id' => $this->user()->tenant_id,
                'name' => $request->name,
                'sort_order' => $request->sort_order ?? 0,
                'is_active' => true,
                'created_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'id' => $type->id,
                'name' => $type->name,
                'sort_order' => $type->sort_order,
                'is_active' => $type->is_active,
            ], 'Görev türü oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('TeacherRoleTypeController::store Error: '.$e->getMessage());

            return $this->errorResponse('Görev türü oluşturulamadı.', 500);
        }
    }

    /**
     * Görev türünü güncelle
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        try {
            $type = TeacherRoleType::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->first();

            if (! $type) {
                return $this->errorResponse('Görev türü bulunamadı.', 404);
            }

            $type->update([
                'name' => $request->name,
                'sort_order' => $request->sort_order ?? $type->sort_order,
                'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $type->is_active,
                'updated_by' => $this->user()->id,
            ]);

            return $this->successResponse([
                'id' => $type->id,
                'name' => $type->name,
                'sort_order' => $type->sort_order,
                'is_active' => $type->is_active,
            ], 'Görev türü güncellendi.');
        } catch (\Throwable $e) {
            Log::error('TeacherRoleTypeController::update Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * Görev türünü sil
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $type = TeacherRoleType::where('id', $id)
                ->where('tenant_id', $this->user()->tenant_id)
                ->first();

            if (! $type) {
                return $this->errorResponse('Görev türü bulunamadı.', 404);
            }

            $type->delete();

            return $this->successResponse(null, 'Görev türü silindi.');
        } catch (\Throwable $e) {
            Log::error('TeacherRoleTypeController::destroy Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }
}
