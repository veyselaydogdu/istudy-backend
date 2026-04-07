<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Hybrid ULID pattern: INT primary keys internally, ULID exposed via API.
 *
 * Adds a `ulid` column (CHAR 26, unique) to externally-exposed tables.
 * Existing rows are back-filled with a generated ULID.
 */
return new class extends Migration
{
    /** @var array<string> Tables that receive a ulid column */
    private array $tables = [
        'users',
        'children',
        'teacher_profiles',
        'family_profiles',
        'schools',
        'classes',
        'activity_classes',
        'authorized_pickups',
    ];

    public function up(): void
    {
        // Step 1: Add nullable ulid column to each table
        foreach ($this->tables as $table) {
            if (! Schema::hasColumn($table, 'ulid')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->char('ulid', 26)->nullable()->unique()->after('id');
                });
            }
        }

        // Step 2: Back-fill existing rows with unique ULIDs
        foreach ($this->tables as $table) {
            DB::table($table)->whereNull('ulid')->orderBy('id')->chunk(200, function ($rows) use ($table): void {
                foreach ($rows as $row) {
                    DB::table($table)
                        ->where('id', $row->id)
                        ->update(['ulid' => (string) Str::ulid()]);
                }
            });
        }

        // Step 3: Make column NOT NULL now that all rows have a value
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->char('ulid', 26)->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasColumn($table, 'ulid')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->dropColumn('ulid');
                });
            }
        }
    }
};
