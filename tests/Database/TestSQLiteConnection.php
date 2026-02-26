<?php

namespace Tests\Database;

use Illuminate\Database\SQLiteConnection;

/**
 * PHP 8.4 + SQLite + RefreshDatabase uyumluluk düzeltmesi.
 *
 * Sorun: Laravel'in SQLiteConnection::executeBeginTransactionStatement() metodu
 * PHP >= 8.4 için PDO::beginTransaction() yerine exec("BEGIN DEFERRED TRANSACTION")
 * kullanır. Bu yöntem PDO'nun dahili inTransaction() bayrağını güncellemez.
 *
 * Sonuç: performRollBack(0) içindeki $pdo->inTransaction() kontrolü false döner
 * ve $pdo->rollBack() hiç çağrılmaz. SQLite bağlantısında açık transaction kalır.
 * Bir sonraki test exec("BEGIN DEFERRED TRANSACTION") çalıştırdığında SQLite
 * "cannot start a transaction within a transaction" hatası fırlatır.
 *
 * Düzeltme 1: Test ortamında PDO::beginTransaction() kullanarak PDO'nun inTransaction()
 * bayrağının doğru çalışmasını sağla.
 *
 * Düzeltme 2: performRollBack(0) doğrudan SQL ROLLBACK kullanarak her koşulda
 * (açık SAVEPOINT'ler dahil) güvenli geri alım sağlar.
 */
class TestSQLiteConnection extends SQLiteConnection
{
    protected function executeBeginTransactionStatement(): void
    {
        $this->getPdo()->beginTransaction();
    }

    protected function performRollBack($toLevel): void
    {
        if ($toLevel === 0) {
            // Doğrudan SQL ROLLBACK: PDO'nun inTransaction() bayrağını atlar.
            // Açık SAVEPOINT'ler olsa bile SQLite her zaman tüm işlemi geri alır.
            try {
                $this->getPdo()->exec('ROLLBACK');
            } catch (\PDOException) {
                // Aktif transaction yok — temiz durum
            }
        } else {
            parent::performRollBack($toLevel);
        }
    }
}
