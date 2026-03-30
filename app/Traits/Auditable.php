<?php

namespace App\Traits;

/**
 * Auditable Trait
 *
 * Bu trait'i kullanan model otomatik olarak activity log'a kaydedilir.
 * BaseModel zaten HistoryObserver kullanıyor, bu trait ek özelleştirme sağlar.
 *
 * Kullanım:
 *   class School extends BaseModel {
 *       use Auditable;
 *
 *       // İsteğe bağlı: loglanmayacak alanlar
 *       protected array $auditExclude = ['cached_data'];
 *
 *       // İsteğe bağlı: sadece bu alanlar loglanır
 *       protected array $auditInclude = ['name', 'status'];
 *
 *       // İsteğe bağlı: okunabilir model etiketi
 *       protected string $auditLabel = 'Okul';
 *   }
 */
trait Auditable
{
    /**
     * Loglanmayacak alan isimleri
     */
    public function getAuditExclude(): array
    {
        return array_merge(
            $this->auditExclude ?? [],
            config('audit.excluded_fields', [])
        );
    }

    /**
     * Sadece loglanacak alanlar (boşsa tümü loglanır)
     */
    public function getAuditInclude(): array
    {
        return $this->auditInclude ?? [];
    }

    /**
     * Okunabilir model etiketi
     */
    public function getAuditLabel(): string
    {
        return $this->auditLabel ?? class_basename($this);
    }

    /**
     * Bu model loglansın mı?
     */
    public function shouldAudit(): bool
    {
        // Hariç tutulan modeller listesinde mi?
        if (in_array(static::class, config('audit.excluded_models', []))) {
            return false;
        }

        return true;
    }

    /**
     * Değişen alanları filtrele (exclude/include)
     */
    public function filterAuditAttributes(array $attributes): array
    {
        $excludes = $this->getAuditExclude();
        $includes = $this->getAuditInclude();

        // Include listesi varsa sadece onları al
        if (! empty($includes)) {
            $attributes = array_intersect_key($attributes, array_flip($includes));
        }

        // Exclude listesindeki alanları çıkar
        return array_diff_key($attributes, array_flip($excludes));
    }

    /**
     * Güncelleme öncesi eski değerleri al (sadece değişen alanlar)
     */
    public function getOldAuditValues(): array
    {
        if (! $this->exists) {
            return [];
        }

        $dirty = $this->getDirty();
        $old   = [];

        foreach (array_keys($dirty) as $key) {
            $old[$key] = $this->getOriginal($key);
        }

        return $this->filterAuditAttributes($old);
    }

    /**
     * Güncelleme sonrası yeni değerleri al (sadece değişen alanlar)
     */
    public function getNewAuditValues(): array
    {
        if (config('audit.only_dirty', true) && $this->exists) {
            return $this->filterAuditAttributes($this->getDirty());
        }

        return $this->filterAuditAttributes($this->getAttributes());
    }

    /**
     * Değişen alan isimlerini al
     */
    public function getChangedFields(): array
    {
        $dirty = $this->getDirty();
        $excludes = $this->getAuditExclude();

        return array_values(array_diff(array_keys($dirty), $excludes));
    }

    /**
     * İnsan okunabilir açıklama üret
     */
    public function generateAuditDescription(string $action): string
    {
        $label = $this->getAuditLabel();
        $userName = auth()->user()?->name ?? 'Sistem';

        return match ($action) {
            'created'       => "{$userName}, {$label} #{$this->getKey()} oluşturdu.",
            'updated'       => "{$userName}, {$label} #{$this->getKey()} güncelledi.",
            'deleted'       => "{$userName}, {$label} #{$this->getKey()} sildi.",
            'restored'      => "{$userName}, {$label} #{$this->getKey()} geri yükledi.",
            'force_deleted' => "{$userName}, {$label} #{$this->getKey()} kalıcı olarak sildi.",
            default         => "{$userName}, {$label} #{$this->getKey()} üzerinde {$action} işlemi yaptı.",
        };
    }
}
