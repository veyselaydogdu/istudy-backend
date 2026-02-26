<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Okul tablosuna iletişim ve konum bilgileri ekleniyor.
     * - country_id: Ülke referansı (countries tablosu)
     * - city: Şehir
     * - fax: Faks numarası
     * - gsm: Cep telefonu
     * - whatsapp: WhatsApp numarası
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            if (! Schema::hasColumn('schools', 'country_id')) {
                $table->foreignId('country_id')
                    ->nullable()
                    ->constrained('countries')
                    ->nullOnDelete()
                    ->after('tenant_id')
                    ->comment('Ülke');
            }

            if (! Schema::hasColumn('schools', 'city')) {
                $table->string('city')->nullable()->after('address')->comment('Şehir');
            }

            if (! Schema::hasColumn('schools', 'fax')) {
                $table->string('fax')->nullable()->max(20)->after('phone')->comment('Faks');
            }

            if (! Schema::hasColumn('schools', 'gsm')) {
                $table->string('gsm')->nullable()->max(20)->after('fax')->comment('Cep Telefonu');
            }

            if (! Schema::hasColumn('schools', 'whatsapp')) {
                $table->string('whatsapp')->nullable()->max(20)->after('gsm')->comment('WhatsApp');
            }
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropForeign(['country_id']);
            $table->dropColumn(['country_id', 'city', 'fax', 'gsm', 'whatsapp']);
        });
    }
};
