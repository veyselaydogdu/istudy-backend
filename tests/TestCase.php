<?php

namespace Tests;

use Illuminate\Database\Connection;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Database\TestSQLiteConnection;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        // PHP 8.4 + SQLite + RefreshDatabase uyumluluk düzeltmesi.
        // Detaylar: tests/Database/TestSQLiteConnection.php
        Connection::resolverFor('sqlite', function ($pdo, $database, $prefix, $config) {
            return new TestSQLiteConnection($pdo, $database, $prefix, $config);
        });

        parent::setUp();
    }
}
