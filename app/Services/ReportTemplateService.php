<?php

namespace App\Services;

use App\Models\Activity\ReportTemplate;
use App\Models\Activity\ReportTemplateInput;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportTemplateService
{
    /**
     * Şablonları listele
     */
    public function list(array $filters = [], int $perPage = 15)
    {
        $query = ReportTemplate::query();

        if (isset($filters['school_id'])) {
            $query->where('school_id', $filters['school_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['frequency'])) {
            $query->where('frequency', $filters['frequency']);
        }

        return $query->orderBy('sort_order')->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Şablon ve inputlarını oluştur
     */
    public function createWithInputs(array $data, array $inputs = []): ReportTemplate
    {
        return DB::transaction(function () use ($data, $inputs) {
            $template = ReportTemplate::create($data);

            if (!empty($inputs)) {
                foreach ($inputs as $inputData) {
                    $this->createInput($template, $inputData);
                }
            }

            return $template->load('inputs');
        });
    }

    /**
     * Şablon ve inputlarını güncelle
     */
    public function updateWithInputs(ReportTemplate $template, array $data, array $inputs = []): ReportTemplate
    {
        return DB::transaction(function () use ($template, $data, $inputs) {
            $template->update($data);

            // Mevcut inputları güncelle veya sil, yenileri ekle
            // Basit yöntem: Hepsini silip yeniden eklemek veri kaybına yol açar (ilişkili raporlar var).
            // Bu yüzden ID varsa güncelle, yoksa ekle. Silinenleri tespit et.

            $existingInputIds = $template->inputs()->pluck('id')->toArray();
            $incomingInputIds = array_filter(array_column($inputs, 'id')); // Sadece ID'si olanlar

            // Silinecekler: Mevcutta olup yeni listede olmayanlar
            $toDelete = array_diff($existingInputIds, $incomingInputIds);
            if (!empty($toDelete)) {
                ReportTemplateInput::destroy($toDelete);
            }

            foreach ($inputs as $index => $inputData) {
                // Sıralamayı index'e göre güncelle
                $inputData['sort_order'] = $index + 1;
                $inputData['report_template_id'] = $template->id;

                if (isset($inputData['id']) && in_array($inputData['id'], $existingInputIds)) {
                    // Güncelle
                    $input = ReportTemplateInput::find($inputData['id']);
                    if ($input) {
                        $input->update($inputData);
                    }
                } else {
                    // Yeni Ekle
                    $this->createInput($template, $inputData);
                }
            }

            return $template->load('inputs');
        });
    }

    /**
     * Tekil input oluştur
     */
    protected function createInput(ReportTemplate $template, array $data): ReportTemplateInput
    {
        // report_template_id'yi manuel set et
        $data['report_template_id'] = $template->id;
        
        // Options array ise json_encode yapmaya gerek yok, model cast ediyor.
        // Ancak gelen veri ham ise dikkat etmeli.

        return ReportTemplateInput::create($data);
    }
}
