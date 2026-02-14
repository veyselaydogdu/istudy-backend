<?php

namespace App\Http\Controllers\Schools;

use App\Http\Requests\ReportTemplate\StoreReportTemplateRequest;
use App\Http\Requests\ReportTemplate\UpdateReportTemplateRequest;
use App\Http\Resources\ReportTemplateResource;
use App\Models\Activity\ReportTemplate;
use App\Services\ReportTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Rapor Şablonu Controller
 *
 * Okulların kendi rapor şablonlarını oluşturması ve yönetmesi.
 * Öğretmenler bu şablonlardaki inputları dolduracak.
 */
class ReportTemplateController extends BaseSchoolController
{
    public function __construct(
        protected ReportTemplateService $service
    ) {
        parent::__construct();
    }

    /**
     * Rapor şablonlarını listele
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['school_id', 'frequency', 'is_active']);
            $templates = $this->service->list($filters, 15);

            return $this->paginatedResponse(
                ReportTemplateResource::collection($templates)->resource
            );
        } catch (\Throwable $e) {
            Log::error('Rapor şablonları listeleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Şablonlar listelenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Şablon detayı (inputları ile birlikte)
     */
    public function show(ReportTemplate $reportTemplate): JsonResponse
    {
        try {
            return $this->successResponse(
                new ReportTemplateResource($reportTemplate->load('inputs'))
            );
        } catch (\Throwable $e) {
            Log::error('Rapor şablonu detay hatası: ' . $e->getMessage());

            return $this->errorResponse('Şablon detayı getirilirken bir hata oluştu.', 500);
        }
    }

    /**
     * Yeni şablon oluştur (inputları ile birlikte)
     */
    public function store(StoreReportTemplateRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['created_by'] = $this->user()->id;

            $inputs = $data['inputs'] ?? [];
            unset($data['inputs']);

            $template = $this->service->createWithInputs($data, $inputs);

            DB::commit();

            return $this->successResponse(
                new ReportTemplateResource($template),
                'Rapor şablonu başarıyla oluşturuldu.',
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rapor şablonu oluşturma hatası: ' . $e->getMessage());

            return $this->errorResponse('Şablon oluşturulurken bir hata oluştu.', 500);
        }
    }

    /**
     * Şablon güncelle (inputları ile birlikte)
     */
    public function update(UpdateReportTemplateRequest $request, ReportTemplate $reportTemplate): JsonResponse
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['updated_by'] = $this->user()->id;

            $inputs = $data['inputs'] ?? [];
            unset($data['inputs']);

            $template = $this->service->updateWithInputs($reportTemplate, $data, $inputs);

            DB::commit();

            return $this->successResponse(
                new ReportTemplateResource($template),
                'Rapor şablonu başarıyla güncellendi.'
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rapor şablonu güncelleme hatası: ' . $e->getMessage());

            return $this->errorResponse('Şablon güncellenirken bir hata oluştu.', 500);
        }
    }

    /**
     * Şablon sil
     */
    public function destroy(ReportTemplate $reportTemplate): JsonResponse
    {
        DB::beginTransaction();
        try {
            $reportTemplate->inputs()->delete();
            $reportTemplate->delete();

            DB::commit();

            return $this->successResponse(null, 'Rapor şablonu başarıyla silindi.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Rapor şablonu silme hatası: ' . $e->getMessage());

            return $this->errorResponse('Şablon silinirken bir hata oluştu.', 500);
        }
    }
}
