<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Base\BaseController;
use App\Models\PackageFeature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin Package Feature Yönetimi
 * Paket özelliklerini (features) CRUD işlemleri
 */
class PackageFeatureController extends BaseController
{
    /**
     * Tüm paket özelliklerini listele
     */
    public function index(): JsonResponse
    {
        try {
            $features = PackageFeature::orderBy('display_order')->get();

            return $this->successResponse($features);
        } catch (\Throwable $e) {
            Log::error('PackageFeatureController::index Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Özellikler listelenirken hata oluştu.', 500);
        }
    }

    /**
     * Yeni özellik oluştur
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'key' => ['required', 'string', 'max:255', 'unique:package_features,key', 'regex:/^[a-z0-9_]+$/'],
            'label' => ['required', 'string', 'max:255'],
            'value_type' => ['required', 'in:bool,text'],
            'description' => ['nullable', 'string', 'max:500'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ], [
            'key.required' => 'Anahtar gereklidir.',
            'key.unique' => 'Bu anahtar zaten kullanılıyor.',
            'key.regex' => 'Anahtar sadece küçük harf, rakam ve alt çizgi içerebilir.',
            'label.required' => 'Etiket gereklidir.',
            'value_type.required' => 'Değer tipi gereklidir.',
            'value_type.in' => 'Değer tipi bool veya text olmalıdır.',
        ]);

        try {
            DB::beginTransaction();

            $feature = PackageFeature::create([
                'key' => $request->key,
                'label' => $request->label,
                'value_type' => $request->value_type,
                'description' => $request->description,
                'display_order' => $request->display_order ?? 0,
            ]);

            DB::commit();

            return $this->successResponse($feature, 'Özellik başarıyla oluşturuldu.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('PackageFeatureController::store Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Özellik oluşturulurken hata oluştu.', 500);
        }
    }

    /**
     * Özellik güncelle
     */
    public function update(Request $request, PackageFeature $packageFeature): JsonResponse
    {
        $request->validate([
            'key' => ['sometimes', 'string', 'max:255', 'unique:package_features,key,'.$packageFeature->id, 'regex:/^[a-z0-9_]+$/'],
            'label' => ['sometimes', 'string', 'max:255'],
            'value_type' => ['sometimes', 'in:bool,text'],
            'description' => ['nullable', 'string', 'max:500'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        try {
            DB::beginTransaction();

            $packageFeature->update($request->only(['key', 'label', 'value_type', 'description', 'display_order']));

            DB::commit();

            return $this->successResponse($packageFeature->fresh(), 'Özellik başarıyla güncellendi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('PackageFeatureController::update Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Özellik güncellenirken hata oluştu.', 500);
        }
    }

    /**
     * Özellik sil
     */
    public function destroy(PackageFeature $packageFeature): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Bu özelliği kullanan paket sayısını kontrol et
            $usageCount = $packageFeature->packages()->count();
            if ($usageCount > 0) {
                return $this->errorResponse(
                    "Bu özellik {$usageCount} pakette kullanılıyor. Önce paketlerden kaldırın.",
                    422
                );
            }

            $packageFeature->delete();

            DB::commit();

            return $this->successResponse(null, 'Özellik başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('PackageFeatureController::destroy Error', ['message' => $e->getMessage()]);

            return $this->errorResponse('Özellik silinirken hata oluştu.', 500);
        }
    }
}
