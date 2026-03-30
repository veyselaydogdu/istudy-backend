<?php

namespace Database\Seeders;

use App\Models\Package\Package;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Başlangıç',
                'description' => 'Küçük kreşler için ideal başlangıç paketi. Tek okul, temel özellikler.',
                'max_schools' => 1,
                'max_classes_per_school' => 3,
                'max_students' => 30,
                'monthly_price' => 299.00,
                'yearly_price' => 2990.00,
                'is_active' => true,
                'features' => [
                    'yoklama' => true,
                    'gunluk_rapor' => true,
                    'etkinlik_yonetimi' => false,
                    'finansal_raporlar' => false,
                    'bildirimler' => true,
                ],
                'sort_order' => 1,
            ],
            [
                'name' => 'Profesyonel',
                'description' => 'Büyüyen kurumlar için genişletilmiş özellikler ve daha yüksek limitler.',
                'max_schools' => 3,
                'max_classes_per_school' => 10,
                'max_students' => 200,
                'monthly_price' => 799.00,
                'yearly_price' => 7990.00,
                'is_active' => true,
                'features' => [
                    'yoklama' => true,
                    'gunluk_rapor' => true,
                    'etkinlik_yonetimi' => true,
                    'finansal_raporlar' => true,
                    'bildirimler' => true,
                    'ozel_raporlar' => false,
                    'api_erisimi' => false,
                ],
                'sort_order' => 2,
            ],
            [
                'name' => 'Kurumsal',
                'description' => 'Büyük kurumlar ve zincir kreşler için sınırsız erişim ve premium özellikler.',
                'max_schools' => 0,  // Sınırsız
                'max_classes_per_school' => 0,  // Sınırsız
                'max_students' => 0,  // Sınırsız
                'monthly_price' => 1999.00,
                'yearly_price' => 19990.00,
                'is_active' => true,
                'features' => [
                    'yoklama' => true,
                    'gunluk_rapor' => true,
                    'etkinlik_yonetimi' => true,
                    'finansal_raporlar' => true,
                    'bildirimler' => true,
                    'ozel_raporlar' => true,
                    'api_erisimi' => true,
                    'oncelikli_destek' => true,
                ],
                'sort_order' => 3,
            ],
        ];

        foreach ($packages as $package) {
            Package::updateOrCreate(
                ['name' => $package['name']],
                $package
            );
        }
    }
}
