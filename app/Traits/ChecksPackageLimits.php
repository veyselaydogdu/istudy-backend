<?php

namespace App\Traits;

use App\Models\Tenant\Tenant;

/**
 * Controller veya Service'lerde paket limiti kontrolü sağlar.
 */
trait ChecksPackageLimits
{
    /**
     * Okul oluşturma limiti kontrolü
     *
     * @throws \Exception
     */
    protected function checkSchoolLimit(Tenant $tenant): void
    {
        if (! $tenant->canCreateSchool()) {
            $package = $tenant->activeSubscription?->package;
            $limit = $package?->max_schools ?? 0;

            throw new \Exception(
                "Okul limiti aşıldı. Paketinizde maksimum {$limit} okul oluşturabilirsiniz. Paketinizi yükseltin.",
                403
            );
        }
    }

    /**
     * Sınıf oluşturma limiti kontrolü (belirli bir okul için)
     *
     * @throws \Exception
     */
    protected function checkClassLimit(Tenant $tenant, int $schoolId): void
    {
        if (! $tenant->canCreateClass($schoolId)) {
            $package = $tenant->activeSubscription?->package;
            $limit = $package?->max_classes_per_school ?? 0;

            throw new \Exception(
                "Bu okulda sınıf limiti aşıldı. Paketinizde okul başına maksimum {$limit} sınıf oluşturabilirsiniz.",
                403
            );
        }
    }

    /**
     * Öğrenci kayıt limiti kontrolü (tenant geneli)
     *
     * @throws \Exception
     */
    protected function checkStudentLimit(Tenant $tenant): void
    {
        if (! $tenant->canEnrollStudent()) {
            $package = $tenant->activeSubscription?->package;
            $limit = $package?->max_students ?? 0;

            throw new \Exception(
                "Toplam öğrenci limiti aşıldı. Paketinizde maksimum {$limit} öğrenci kaydedebilirsiniz.",
                403
            );
        }
    }
}
