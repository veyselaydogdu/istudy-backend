<?php

namespace Database\Seeders;

use App\Models\Package\Package;
use App\Models\PackageFeature;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        // ── Global özellik tanımları ───────────────────────────────────────────
        $featureDefs = [
            ['key' => 'yoklama',           'label' => 'Günlük Yoklama',         'value_type' => 'bool', 'display_order' => 1],
            ['key' => 'gunluk_rapor',      'label' => 'Günlük Rapor',           'value_type' => 'bool', 'display_order' => 2],
            ['key' => 'bildirimler',       'label' => 'Push Bildirimler',        'value_type' => 'bool', 'display_order' => 3],
            ['key' => 'etkinlik',          'label' => 'Etkinlik Yönetimi',      'value_type' => 'bool', 'display_order' => 4],
            ['key' => 'yemek_menusu',      'label' => 'Yemek Menüsü',           'value_type' => 'bool', 'display_order' => 5],
            ['key' => 'finansal_raporlar', 'label' => 'Finansal Raporlar',      'value_type' => 'bool', 'display_order' => 6],
            ['key' => 'ozel_raporlar',     'label' => 'Özel Raporlar',          'value_type' => 'bool', 'display_order' => 7],
            ['key' => 'api_erisimi',       'label' => 'API Erişimi',            'value_type' => 'bool', 'display_order' => 8],
            ['key' => 'oncelikli_destek',  'label' => 'Öncelikli Destek',       'value_type' => 'bool', 'display_order' => 9],
            ['key' => 'veli_app',          'label' => 'Veli Mobil Uygulaması',  'value_type' => 'bool', 'display_order' => 10],
        ];

        $features = [];
        foreach ($featureDefs as $def) {
            $features[$def['key']] = PackageFeature::updateOrCreate(
                ['key' => $def['key']],
                $def
            );
        }

        // ── Paketler ──────────────────────────────────────────────────────────
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
                'sort_order' => 1,
                'features_map' => [
                    'yoklama' => 'true',
                    'gunluk_rapor' => 'true',
                    'bildirimler' => 'true',
                    'veli_app' => 'true',
                ],
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
                'sort_order' => 2,
                'features_map' => [
                    'yoklama' => 'true',
                    'gunluk_rapor' => 'true',
                    'bildirimler' => 'true',
                    'etkinlik' => 'true',
                    'yemek_menusu' => 'true',
                    'finansal_raporlar' => 'true',
                    'veli_app' => 'true',
                ],
            ],
            [
                'name' => 'Kurumsal',
                'description' => 'Büyük kurumlar ve zincir kreşler için sınırsız erişim ve premium özellikler.',
                'max_schools' => 0,
                'max_classes_per_school' => 0,
                'max_students' => 0,
                'monthly_price' => 1999.00,
                'yearly_price' => 19990.00,
                'is_active' => true,
                'sort_order' => 3,
                'features_map' => [
                    'yoklama' => 'true',
                    'gunluk_rapor' => 'true',
                    'bildirimler' => 'true',
                    'etkinlik' => 'true',
                    'yemek_menusu' => 'true',
                    'finansal_raporlar' => 'true',
                    'ozel_raporlar' => 'true',
                    'api_erisimi' => 'true',
                    'oncelikli_destek' => 'true',
                    'veli_app' => 'true',
                ],
            ],
        ];

        foreach ($packages as $packageData) {
            $featuresMap = $packageData['features_map'];
            unset($packageData['features_map']);

            // JSON features kolonu (eski uyumluluk)
            $packageData['features'] = array_map(
                fn ($v) => $v === 'true',
                $featuresMap
            );

            $package = Package::updateOrCreate(
                ['name' => $packageData['name']],
                $packageData
            );

            // package_feature_pivot ilişkisi
            $pivotData = [];
            foreach ($featuresMap as $key => $value) {
                if (isset($features[$key])) {
                    $pivotData[$features[$key]->id] = ['value' => $value];
                }
            }
            if ($pivotData) {
                $package->packageFeatures()->sync($pivotData);
            }
        }
    }
}
