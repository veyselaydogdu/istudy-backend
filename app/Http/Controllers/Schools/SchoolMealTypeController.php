<?php

namespace App\Http\Controllers\Schools;

use App\Models\Health\SchoolMealType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SchoolMealTypeController extends BaseSchoolController
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Okula ait öğün türlerini listele
     */
    public function index(int $school_id): JsonResponse
    {
        try {
            $types = SchoolMealType::where('school_id', $school_id)
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
            Log::error('SchoolMealTypeController::index Error: '.$e->getMessage());

            return $this->errorResponse('Öğün türleri yüklenemedi.', 500);
        }
    }

    /**
     * Yeni öğün türü oluştur
     */
    public function store(Request $request, int $school_id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        try {
            $type = SchoolMealType::create([
                'school_id' => $school_id,
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
            ], 'Öğün türü oluşturuldu.', 201);
        } catch (\Throwable $e) {
            Log::error('SchoolMealTypeController::store Error: '.$e->getMessage());

            return $this->errorResponse('Öğün türü oluşturulamadı.', 500);
        }
    }

    /**
     * Öğün türünü güncelle
     */
    public function update(Request $request, int $school_id, int $id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        try {
            $type = SchoolMealType::where('id', $id)
                ->where('school_id', $school_id)
                ->first();

            if (! $type) {
                return $this->errorResponse('Öğün türü bulunamadı.', 404);
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
            ], 'Öğün türü güncellendi.');
        } catch (\Throwable $e) {
            Log::error('SchoolMealTypeController::update Error: '.$e->getMessage());

            return $this->errorResponse('Güncelleme başarısız.', 500);
        }
    }

    /**
     * Öğün türünü sil
     */
    public function destroy(int $school_id, int $id): JsonResponse
    {
        try {
            $type = SchoolMealType::where('id', $id)
                ->where('school_id', $school_id)
                ->first();

            if (! $type) {
                return $this->errorResponse('Öğün türü bulunamadı.', 404);
            }

            $type->delete();

            return $this->successResponse(null, 'Öğün türü silindi.');
        } catch (\Throwable $e) {
            Log::error('SchoolMealTypeController::destroy Error: '.$e->getMessage());

            return $this->errorResponse('Silme başarısız.', 500);
        }
    }
}
