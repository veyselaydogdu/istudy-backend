<?php

namespace App\Services;

use App\Models\Activity\ReportTemplate;

/**
 * Rapor Şablonu Servisi
 *
 * Okulların kendi rapor şablonlarını oluşturması ve yönetmesi.
 */
class ReportTemplateService extends BaseService
{
    protected function model(): string
    {
        return ReportTemplate::class;
    }

    /**
     * Şablon oluştur (inputları ile birlikte)
     */
    public function createWithInputs(array $templateData, array $inputs = []): ReportTemplate
    {
        $template = $this->create($templateData);

        foreach ($inputs as $index => $input) {
            $input['report_template_id'] = $template->id;
            $input['sort_order'] = $input['sort_order'] ?? $index;
            $input['created_by'] = $templateData['created_by'];
            $template->inputs()->create($input);
        }

        return $template->load('inputs');
    }

    /**
     * Şablon güncelle (inputları ile birlikte)
     */
    public function updateWithInputs(ReportTemplate $template, array $templateData, array $inputs = []): ReportTemplate
    {
        $this->update($template, $templateData);

        if (! empty($inputs)) {
            // Mevcut inputları sil ve yeniden oluştur
            $template->inputs()->delete();

            foreach ($inputs as $index => $input) {
                $input['report_template_id'] = $template->id;
                $input['sort_order'] = $input['sort_order'] ?? $index;
                $input['created_by'] = $templateData['updated_by'] ?? auth()->id();
                $template->inputs()->create($input);
            }
        }

        return $template->fresh('inputs');
    }

    /**
     * Filtreleme
     */
    protected function applyFilters($query, array $filters): void
    {
        if (! empty($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (! empty($filters['frequency'])) {
            $query->where('frequency', $filters['frequency']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }
    }
}
