<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->time('start_time')->nullable()->after('start_date');
            $table->time('end_time')->nullable()->after('end_date');
            $table->boolean('cancellation_allowed')->default(false)->after('is_enrollment_required');
            $table->dateTime('cancellation_deadline')->nullable()->after('cancellation_allowed');
        });

        Schema::table('activity_enrollments', function (Blueprint $table) {
            $table->unsignedBigInteger('invoice_id')->nullable()->after('note');
            $table->foreign('invoice_id')->references('id')->on('invoices')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('activity_enrollments', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
            $table->dropColumn('invoice_id');
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time', 'cancellation_allowed', 'cancellation_deadline']);
        });
    }
};
